//! Tauri commands exposed to the frontend (`lib/persistence/desktop`).
//!
//! The crate ID is the absolute path of a local crate zip file. While a crate
//! is open, its working copy lives in a temporary directory (`session.rs`);
//! every mutating command writes the working copy back into the original zip
//! file ("every save").

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::ipc::Response;
use tauri::{AppHandle, Manager, State};
use tempfile::TempDir;

use crate::fsops::{self, METADATA_FILE};
use crate::session::{normalize_crate_root, AppState};

#[derive(Serialize)]
pub struct EntryInfo {
    #[serde(rename = "type")]
    kind: String,
    name: String,
    path: String,
}

#[derive(Serialize)]
pub struct MovedEntry {
    from: String,
    to: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaInfo {
    used_space: u64,
    total_space: u64,
    persistent: bool,
}

/// Convert a relative path (directories carry a trailing `/`) into the
/// `EntryInfo` shape expected by the frontend.
fn to_entry_info(path: &str) -> EntryInfo {
    let is_directory = path.ends_with('/');
    let normalized = path.trim_end_matches('/');
    let name = normalized.rsplit('/').next().unwrap_or(normalized);
    EntryInfo {
        kind: if is_directory { "directory" } else { "file" }.to_string(),
        name: name.to_string(),
        path: path.to_string(),
    }
}

/// Directory created crates are written to when the caller does not pick one.
fn resolve_dest_dir(app: &AppHandle, dest_dir: Option<String>) -> Result<PathBuf, String> {
    if let Some(dir) = dest_dir {
        return Ok(PathBuf::from(dir));
    }
    let documents = app
        .path()
        .document_dir()
        .map_err(|e| format!("Failed to resolve documents directory: {e}"))?;
    Ok(documents.join("NovaCrate"))
}

/// Zip a directory into an in-memory response.
fn zip_dir_to_response(source: &Path, prefix: &str, compressed: bool) -> Result<Response, String> {
    let bytes = fsops::zip_dir_to_bytes(source, prefix, compressed)?;
    Ok(Response::new(bytes))
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/// Simple liveness check for the native backend.
#[tauri::command]
pub fn ping() -> String {
    "pong".to_string()
}

// ---------------------------------------------------------------------------
// Crate session lifecycle
// ---------------------------------------------------------------------------

/// Extract the crate zip at `crate_id` into a temporary working directory.
/// Re-entrant: calling it again for the same crate only increments the
/// reference count of the existing session.
#[tauri::command]
pub async fn open_crate(app: AppHandle, crate_id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        state.open_session(&crate_id)
    })
    .await
    .map_err(|e| format!("Opening crate failed: {e}"))?
}

/// Drop one reference to the session of `crate_id`. The working copy is
/// removed when the last reference is gone.
#[tauri::command]
pub fn close_crate(state: State<'_, AppState>, crate_id: String) -> Result<(), String> {
    state.close_session(&crate_id)
}

// ---------------------------------------------------------------------------
// File service operations
// ---------------------------------------------------------------------------

/// Read the raw bytes of a file inside the working copy.
#[tauri::command]
pub fn read_file(
    state: State<'_, AppState>,
    crate_id: String,
    path: String,
) -> Result<Response, String> {
    state.with_session(&crate_id, |session| {
        let target = fsops::resolve_rel_path(session.crate_root(), &path)?;
        let contents = fs::read(&target).map_err(|e| format!("Failed to read {path}: {e}"))?;
        Ok(Response::new(contents))
    })
}

/// Write a file inside the working copy, then write the whole working copy
/// back into the original crate zip.
#[tauri::command]
pub async fn write_file(
    app: AppHandle,
    crate_id: String,
    path: String,
    contents: Vec<u8>,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        state.with_session(&crate_id, |session| {
            let target = fsops::resolve_rel_path(session.crate_root(), &path)?;
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory: {e}"))?;
            }
            fs::write(&target, contents).map_err(|e| format!("Failed to write {path}: {e}"))?;
            Ok(())
        })?;
        state.save_crate(&crate_id)
    })
    .await
    .map_err(|e| format!("Writing file failed: {e}"))?
}

/// Create a directory inside the working copy. Empty directories are not
/// representable inside a zip, so no save is triggered.
#[tauri::command]
pub fn create_folder(
    state: State<'_, AppState>,
    crate_id: String,
    path: String,
) -> Result<(), String> {
    state.with_session(&crate_id, |session| {
        let target = fsops::resolve_rel_path(session.crate_root(), &path)?;
        fs::create_dir_all(&target).map_err(|e| format!("Failed to create folder {path}: {e}"))?;
        Ok(())
    })
}

/// Flat list of all files and directories inside the crate.
#[tauri::command]
pub fn list_crate_contents(
    state: State<'_, AppState>,
    crate_id: String,
) -> Result<Vec<EntryInfo>, String> {
    state.with_session(&crate_id, |session| {
        let entries = fsops::list_recursive(session.crate_root())?;
        Ok(entries.iter().map(|path| to_entry_info(path)).collect())
    })
}

/// Info for a single file or directory inside the crate.
#[tauri::command]
pub fn get_crate_file_info(
    state: State<'_, AppState>,
    crate_id: String,
    path: String,
) -> Result<EntryInfo, String> {
    state.with_session(&crate_id, |session| {
        let target = fsops::resolve_rel_path(session.crate_root(), &path)?;
        let metadata =
            fs::symlink_metadata(&target).map_err(|e| format!("Failed to read {path}: {e}"))?;
        let name = target
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .unwrap_or_else(|| path.clone());
        Ok(EntryInfo {
            kind: if metadata.is_dir() {
                "directory"
            } else {
                "file"
            }
            .to_string(),
            name,
            path,
        })
    })
}

/// Move (rename) a file or directory inside the working copy, then save.
/// Returns the list of affected entries (including children of moved
/// directories), with directories carrying a trailing `/`.
#[tauri::command]
pub async fn move_crate_entry(
    app: AppHandle,
    crate_id: String,
    src: String,
    dest: String,
) -> Result<Vec<MovedEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let impact = state.with_session(&crate_id, |session| {
            let root = session.crate_root();
            let source = fsops::resolve_rel_path(root, &src)?;
            let destination = fsops::resolve_rel_path(root, &dest)?;
            if !source.exists() {
                return Err(format!("Source does not exist: {src}"));
            }
            if destination.exists() {
                return Err(format!("Destination already exists: {dest}"));
            }
            if let Some(parent) = destination.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory: {e}"))?;
            }

            let src_norm = fsops::normalize_rel_path(&src);
            let dest_norm = fsops::normalize_rel_path(&dest);
            let mut changes: Vec<MovedEntry> = Vec::new();

            if source.is_dir() {
                // Collect the affected entries (relative to the moved folder)
                // before renaming so they can be reported with full paths.
                let entries = fsops::list_recursive(&source)?;
                fs::rename(&source, &destination)
                    .map_err(|e| format!("Failed to move {src} to {dest}: {e}"))?;
                let src_prefix = format!("{src_norm}/");
                let dest_prefix = format!("{dest_norm}/");
                changes.push(MovedEntry {
                    from: format!("{src_norm}/"),
                    to: format!("{dest_norm}/"),
                });
                for entry in entries {
                    changes.push(MovedEntry {
                        to: entry.replacen(&src_prefix, &dest_prefix, 1),
                        from: entry,
                    });
                }
            } else {
                fs::rename(&source, &destination)
                    .map_err(|e| format!("Failed to move {src} to {dest}: {e}"))?;
                changes.push(MovedEntry {
                    from: src_norm,
                    to: dest_norm,
                });
            }
            Ok(changes)
        })?;
        state.save_crate(&crate_id)?;
        Ok(impact)
    })
    .await
    .map_err(|e| format!("Moving entry failed: {e}"))?
}

/// Delete a file or directory (recursively) inside the working copy, then
/// save. Returns the paths of all deleted entries, directories with a
/// trailing `/`.
#[tauri::command]
pub async fn delete_crate_entry(
    app: AppHandle,
    crate_id: String,
    path: String,
) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let deleted = state.with_session(&crate_id, |session| {
            let target = fsops::resolve_rel_path(session.crate_root(), &path)?;
            let metadata =
                fs::symlink_metadata(&target).map_err(|e| format!("Failed to read {path}: {e}"))?;
            let path_norm = fsops::normalize_rel_path(&path);

            if !metadata.is_dir() {
                fs::remove_file(&target).map_err(|e| format!("Failed to delete {path}: {e}"))?;
                return Ok(vec![path_norm]);
            }

            let entries = fsops::list_recursive(&target)?;
            let mut files: Vec<String> = Vec::new();
            let mut dirs: Vec<String> = Vec::new();
            for entry in entries {
                if entry.ends_with('/') {
                    dirs.push(entry);
                } else {
                    files.push(entry);
                }
            }
            // Delete files first, then directories deepest-first.
            dirs.sort_by_key(|dir| std::cmp::Reverse(dir.matches('/').count()));

            let mut deleted = vec![format!("{path_norm}/")];
            for file in files {
                fs::remove_file(target.join(&file))
                    .map_err(|e| format!("Failed to delete {file}: {e}"))?;
                deleted.push(file);
            }
            for dir in dirs {
                fs::remove_dir(target.join(dir.trim_end_matches('/')))
                    .map_err(|e| format!("Failed to delete {dir}: {e}"))?;
                deleted.push(dir);
            }
            fs::remove_dir(&target).map_err(|e| format!("Failed to delete {path}: {e}"))?;
            Ok(deleted)
        })?;
        state.save_crate(&crate_id)?;
        Ok(deleted)
    })
    .await
    .map_err(|e| format!("Deleting entry failed: {e}"))?
}

/// Storage usage of the working copy and free disk space.
#[tauri::command]
pub fn get_crate_quota(state: State<'_, AppState>, crate_id: String) -> Result<QuotaInfo, String> {
    state.with_session(&crate_id, |session| {
        let used_space = fsops::dir_size(session.crate_root());
        let total_space = fsops::available_space(session.crate_root())?;
        Ok(QuotaInfo {
            used_space,
            total_space,
            persistent: true,
        })
    })
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/// Export a crate. Unlike the file operations this also works for crates
/// without an open session by reading the zip file on disk directly.
#[tauri::command]
pub async fn export_crate(
    app: AppHandle,
    crate_id: String,
    format: String,
    compressed: Option<bool>,
) -> Result<Response, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let compressed = compressed.unwrap_or(true);
        match format.as_str() {
            "zip" => state.with_session_or_archive(
                &crate_id,
                |session| zip_dir_to_response(session.crate_root(), "", compressed),
                |zip_path| {
                    // The original file is already a zip archive.
                    let bytes = fs::read(zip_path)
                        .map_err(|e| format!("Failed to read {}: {e}", zip_path.display()))?;
                    Ok(Response::new(bytes))
                },
            ),
            "eln" => {
                let stem = PathBuf::from(&crate_id)
                    .file_stem()
                    .map(|stem| stem.to_string_lossy().to_string())
                    .unwrap_or_else(|| "crate".to_string());
                state.with_session_or_archive(
                    &crate_id,
                    |session| zip_dir_to_response(session.crate_root(), &stem, compressed),
                    |zip_path| {
                        let temp = TempDir::with_prefix("novacrate-eln-")
                            .map_err(|e| format!("Failed to create temporary directory: {e}"))?;
                        let archive = fs::File::open(zip_path)
                            .map_err(|e| format!("Failed to read {}: {e}", zip_path.display()))?;
                        fsops::extract_zip(archive, temp.path())?;
                        zip_dir_to_response(temp.path(), &stem, compressed)
                    },
                )
            }
            "standalone-json" => state.with_session_or_archive(
                &crate_id,
                |session| {
                    let bytes = fs::read(session.crate_root().join(METADATA_FILE))
                        .map_err(|e| format!("Failed to read {METADATA_FILE}: {e}"))?;
                    Ok(Response::new(bytes))
                },
                |zip_path| {
                    let archive = fs::File::open(zip_path)
                        .map_err(|e| format!("Failed to read {}: {e}", zip_path.display()))?;
                    let mut archive = zip::ZipArchive::new(archive)
                        .map_err(|e| format!("Failed to read crate archive: {e}"))?;
                    let mut entry = archive
                        .by_name(METADATA_FILE)
                        .map_err(|e| format!("Failed to read {METADATA_FILE}: {e}"))?;
                    let mut bytes = Vec::new();
                    entry
                        .read_to_end(&mut bytes)
                        .map_err(|e| format!("Failed to read {METADATA_FILE}: {e}"))?;
                    Ok(Response::new(bytes))
                },
            ),
            other => Err(format!("Unknown export format: {other}")),
        }
    })
    .await
    .map_err(|e| format!("Exporting crate failed: {e}"))?
}

// ---------------------------------------------------------------------------
// Repository operations
// ---------------------------------------------------------------------------

/// Whether a file exists at `crate_id`. Used to validate the recents list.
#[tauri::command]
pub fn crate_exists(crate_id: String) -> bool {
    fs::symlink_metadata(&crate_id).is_ok()
}

/// Import a crate archive: validate and normalize its layout, then write it
/// as a crate zip into `dest_dir` (defaults to `~/Documents/NovaCrate`).
/// Returns the crate ID, i.e. the path of the created zip file.
#[tauri::command]
pub async fn create_crate_from_zip_bytes(
    app: AppHandle,
    bytes: Vec<u8>,
    dest_dir: Option<String>,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = resolve_dest_dir(&app, dest_dir)?;
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create {}: {e}", dir.display()))?;

        let temp = TempDir::with_prefix("novacrate-import-")
            .map_err(|e| format!("Failed to create temporary directory: {e}"))?;
        fsops::extract_zip(std::io::Cursor::new(bytes), temp.path())?;
        let prefix =
            normalize_crate_root(temp.path()).map_err(|e| format!("Invalid crate archive: {e}"))?;

        let crate_id = dir.join(format!("{}.zip", uuid::Uuid::new_v4()));
        let archive = fs::File::create(&crate_id)
            .map_err(|e| format!("Failed to create {}: {e}", crate_id.display()))?;
        fsops::write_dir_as_zip(temp.path(), &prefix, true, archive)?;
        Ok(crate_id.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| format!("Importing crate failed: {e}"))?
}

/// Create a new crate zip containing only `ro-crate-metadata.json` in
/// `dest_dir` (defaults to `~/Documents/NovaCrate`). Returns the crate ID,
/// i.e. the path of the created zip file.
#[tauri::command]
pub async fn create_crate_from_metadata(
    app: AppHandle,
    metadata: String,
    dest_dir: Option<String>,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = resolve_dest_dir(&app, dest_dir)?;
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create {}: {e}", dir.display()))?;

        let crate_id = dir.join(format!("crate-{}.zip", uuid::Uuid::new_v4()));
        let archive = fs::File::create(&crate_id)
            .map_err(|e| format!("Failed to create {}: {e}", crate_id.display()))?;
        fsops::write_single_file_zip(METADATA_FILE, metadata.as_bytes(), true, archive)?;
        Ok(crate_id.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| format!("Creating crate failed: {e}"))?
}

/// Delete a crate zip file. The file is moved to the OS trash instead of
/// being deleted permanently, and any open session is closed first.
#[tauri::command]
pub fn delete_crate_file(state: State<'_, AppState>, crate_id: String) -> Result<(), String> {
    // Close any open session first so the working copy is cleaned up.
    let _ = state.close_session(&crate_id);
    match fs::canonicalize(&crate_id) {
        Ok(path) => trash::delete(&path).map_err(|e| format!("Failed to delete crate: {e}")),
        // The crate file does not exist any more — treat as deleted.
        Err(_) => Ok(()),
    }
}

/// Storage usage of the default crates directory and free disk space.
#[tauri::command]
pub async fn repository_quota(
    app: AppHandle,
    dest_dir: Option<String>,
) -> Result<QuotaInfo, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = resolve_dest_dir(&app, dest_dir)?;
        let _ = fs::create_dir_all(&dir);
        let used_space = fsops::dir_size(&dir);
        let total_space = fsops::available_space(&dir)?;
        Ok(QuotaInfo {
            used_space,
            total_space,
            persistent: true,
        })
    })
    .await
    .map_err(|e| format!("Querying storage failed: {e}"))?
}
