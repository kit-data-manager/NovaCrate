//! Management of open crate sessions.
//!
//! A session is the extracted working copy of a local crate zip plus the
//! metadata needed to write changes back into the original zip file. Sessions
//! are keyed by crate ID (the canonical absolute path of the zip file) and
//! reference-counted, so multiple services may share one working copy.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tempfile::TempDir;

use crate::fsops::{self, METADATA_FILE};

const POISONED: &str = "Crate session registry is unavailable";

pub struct CrateSession {
    /// Absolute path of the original crate zip file (also the crate ID).
    pub zip_path: PathBuf,
    /// Extracted working directory. Deleted when the session is dropped.
    pub tmp_dir: TempDir,
    /// Optional sub-directory inside the zip that contains the crate (ELN
    /// layout). Empty for flat crates. Preserved when saving.
    pub prefix: String,
    /// Number of open services referencing this session.
    ref_count: u32,
}

impl CrateSession {
    /// Directory all crate-relative paths resolve against.
    pub fn crate_root(&self) -> &Path {
        self.tmp_dir.path()
    }
}

#[derive(Default)]
pub struct AppState {
    sessions: Mutex<HashMap<String, CrateSession>>,
}

/// Canonicalize a crate path, producing a descriptive error on failure.
fn canonicalize_crate_path(crate_id: &str) -> Result<PathBuf, String> {
    fs::canonicalize(crate_id).map_err(|e| format!("Cannot open crate {crate_id}: {e}"))
}

/// Detect the crate layout inside an extracted archive and flatten it so that
/// all crate files live directly in `root`.
///
/// Returns the sub-directory prefix that the crate occupied inside the zip
/// (empty for flat crates) so that saving can preserve the original layout.
pub fn normalize_crate_root(root: &Path) -> Result<String, String> {
    if root.join(METADATA_FILE).is_file() {
        return Ok(String::new());
    }

    let mut sub_dirs: Vec<PathBuf> = Vec::new();
    let read = fs::read_dir(root).map_err(|e| format!("Failed to read extracted crate: {e}"))?;
    for entry in read {
        let entry = entry.map_err(|e| format!("Failed to read extracted crate: {e}"))?;
        let name = entry.file_name().to_string_lossy().to_string();
        if fsops::is_ignored_entry_name(&name) {
            let _ = if entry.path().is_dir() {
                fs::remove_dir_all(entry.path())
            } else {
                fs::remove_file(entry.path())
            };
            continue;
        }
        if entry.path().is_dir() {
            sub_dirs.push(entry.path());
        }
    }

    // ELN format: a single folder in the archive root containing the crate.
    if sub_dirs.len() == 1 && sub_dirs[0].join(METADATA_FILE).is_file() {
        let sub = sub_dirs.remove(0);
        let prefix = sub
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .ok_or("Could not determine crate sub-folder")?;
        for entry in fs::read_dir(&sub).map_err(|e| format!("Failed to read {sub:?}: {e}"))? {
            let entry = entry.map_err(|e| format!("Failed to read {sub:?}: {e}"))?;
            let target = root.join(entry.file_name());
            fs::rename(entry.path(), &target)
                .map_err(|e| format!("Failed to move {:?} to {target:?}: {e}", entry.path()))?;
        }
        fs::remove_dir(&sub).map_err(|e| format!("Failed to remove {sub:?}: {e}"))?;
        return Ok(prefix);
    }

    Err("Could not find crate root. Make sure the ro-crate-metadata.json file is in the root directory of the zip.".to_string())
}

impl AppState {
    /// Resolve the registry key for a crate. Sessions are stored under the
    /// canonical absolute zip path, but lookups also accept the exact string
    /// the caller originally used.
    fn resolve_key(
        &self,
        sessions: &HashMap<String, CrateSession>,
        crate_id: &str,
    ) -> Result<String, String> {
        if sessions.contains_key(crate_id) {
            return Ok(crate_id.to_string());
        }
        let canonical = canonicalize_crate_path(crate_id)?
            .to_string_lossy()
            .to_string();
        if sessions.contains_key(&canonical) {
            Ok(canonical)
        } else {
            Err(format!("No open crate session for {crate_id}"))
        }
    }

    /// Open (or re-use) the session for `crate_id` and increment its
    /// reference count. The crate zip is extracted into a temporary directory
    /// on first open.
    pub fn open_session(&self, crate_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|_| POISONED)?;
        let key = if sessions.contains_key(crate_id) {
            crate_id.to_string()
        } else {
            canonicalize_crate_path(crate_id)?
                .to_string_lossy()
                .to_string()
        };

        if let Some(session) = sessions.get_mut(&key) {
            session.ref_count += 1;
            return Ok(());
        }

        let zip_path = PathBuf::from(&key);
        let tmp_dir = TempDir::with_prefix("novacrate-crate-")
            .map_err(|e| format!("Failed to create temporary directory: {e}"))?;
        let archive =
            fs::File::open(&zip_path).map_err(|e| format!("Failed to open crate archive: {e}"))?;
        fsops::extract_zip(archive, tmp_dir.path())?;
        let prefix = normalize_crate_root(tmp_dir.path())?;

        sessions.insert(
            key,
            CrateSession {
                zip_path,
                tmp_dir,
                prefix,
                ref_count: 1,
            },
        );
        Ok(())
    }

    /// Drop one reference to the session of `crate_id`. The extracted working
    /// copy is deleted when the last reference is gone.
    pub fn close_session(&self, crate_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|_| POISONED)?;
        let key = match self.resolve_key(&sessions, crate_id) {
            Ok(key) => key,
            // The crate is not open any more — closing is a no-op.
            Err(_) => return Ok(()),
        };
        let remove = if let Some(session) = sessions.get_mut(&key) {
            session.ref_count = session.ref_count.saturating_sub(1);
            session.ref_count == 0
        } else {
            false
        };
        if remove {
            sessions.remove(&key);
        }
        Ok(())
    }

    /// Run `f` with the session of `crate_id` locked.
    pub fn with_session<R>(
        &self,
        crate_id: &str,
        f: impl FnOnce(&CrateSession) -> Result<R, String>,
    ) -> Result<R, String> {
        let sessions = self.sessions.lock().map_err(|_| POISONED)?;
        let key = self.resolve_key(&sessions, crate_id)?;
        let session = sessions
            .get(&key)
            .ok_or_else(|| format!("No open crate session for {crate_id}"))?;
        f(session)
    }

    /// Run `open` with the session of `crate_id` if one is open, otherwise
    /// run `closed` with the path of the crate zip on disk.
    pub fn with_session_or_archive<R>(
        &self,
        crate_id: &str,
        open: impl FnOnce(&CrateSession) -> Result<R, String>,
        closed: impl FnOnce(&Path) -> Result<R, String>,
    ) -> Result<R, String> {
        let sessions = self.sessions.lock().map_err(|_| POISONED)?;
        let key = if sessions.contains_key(crate_id) {
            crate_id.to_string()
        } else {
            canonicalize_crate_path(crate_id)?
                .to_string_lossy()
                .to_string()
        };
        match sessions.get(&key) {
            Some(session) => open(session),
            None => closed(Path::new(&key)),
        }
    }

    /// Write the current state of the working copy back into the original
    /// crate zip file. Called after every mutating operation ("every save").
    pub fn save_crate(&self, crate_id: &str) -> Result<(), String> {
        self.with_session(crate_id, |session| {
            let parent = session
                .zip_path
                .parent()
                .ok_or_else(|| format!("Invalid crate path: {}", session.zip_path.display()))?;
            let temp_zip = parent.join(format!(".novacrate-save-{}.zip", uuid::Uuid::new_v4()));
            let archive = fs::File::create(&temp_zip)
                .map_err(|e| format!("Failed to create temporary archive: {e}"))?;
            let write_result =
                fsops::write_dir_as_zip(session.crate_root(), &session.prefix, true, archive);
            match write_result {
                Ok(()) => fsops::replace_file(&temp_zip, &session.zip_path),
                Err(e) => {
                    let _ = fs::remove_file(&temp_zip);
                    Err(e)
                }
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_crate_root_accepts_flat_layout() {
        let root = tempfile::tempdir().unwrap();
        fs::write(root.path().join(METADATA_FILE), b"{}").unwrap();
        assert_eq!(normalize_crate_root(root.path()).unwrap(), "");
    }

    #[test]
    fn normalize_crate_root_flattens_eln_layout() {
        let root = tempfile::tempdir().unwrap();
        let sub = root.path().join("MyExperiment");
        fs::create_dir(&sub).unwrap();
        fs::write(sub.join(METADATA_FILE), b"{}").unwrap();
        fs::write(sub.join("data.txt"), b"hello").unwrap();

        let prefix = normalize_crate_root(root.path()).unwrap();
        assert_eq!(prefix, "MyExperiment");
        assert!(root.path().join(METADATA_FILE).is_file());
        assert!(root.path().join("data.txt").is_file());
        assert!(!sub.exists());
    }

    #[test]
    fn normalize_crate_root_rejects_unknown_layout() {
        let root = tempfile::tempdir().unwrap();
        fs::write(root.path().join("data.txt"), b"hello").unwrap();
        assert!(normalize_crate_root(root.path()).is_err());
    }
}
