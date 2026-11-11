//! File-system helpers for extracting, reading and writing crate archives.
//!
//! All crate-relative paths use forward-slash separators. Every helper that
//! resolves a user-provided relative path rejects `..` traversal so that the
//! frontend cannot escape the extracted crate working directory.

use std::fs;
use std::io::{self, Read, Seek, Write};
use std::path::{Path, PathBuf};

use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::CompressionMethod;

/// Name of the RO-Crate metadata file inside a crate.
pub const METADATA_FILE: &str = "ro-crate-metadata.json";

/// Junk entries that are removed when working with a crate archive.
const IGNORED_ENTRY_NAMES: [&str; 2] = ["__MACOSX", ".DS_Store"];

/// Whether `name` (a relative zip path using `/` separators) is a junk entry.
pub fn is_ignored_entry_name(name: &str) -> bool {
    IGNORED_ENTRY_NAMES
        .iter()
        .any(|ignored| name == *ignored || name.starts_with(&format!("{ignored}/")))
}

fn is_ignored_entry(name: &str) -> bool {
    is_ignored_entry_name(name)
}

/// Resolve a crate-relative path (forward-slash separated) onto `root`,
/// rejecting absolute paths and `..` traversal for safety.
pub fn resolve_rel_path(root: &Path, rel: &str) -> Result<PathBuf, String> {
    if rel.trim().is_empty() {
        return Err("Path must not be empty".to_string());
    }
    if rel.starts_with('/') {
        return Err(format!("Absolute paths are not allowed: {rel}"));
    }
    let mut resolved = root.to_path_buf();
    for component in rel.split('/') {
        if component.is_empty() || component == "." {
            continue;
        }
        if component == ".." {
            return Err(format!("Path traversal is not allowed: {rel}"));
        }
        resolved.push(component);
    }
    Ok(resolved)
}

/// Normalize a relative path for display: trim trailing slashes so that it can
/// be joined or compared consistently.
pub fn normalize_rel_path(rel: &str) -> String {
    rel.trim_end_matches('/').to_string()
}

/// Extract a zip archive into `dest`, creating missing parent directories.
/// Junk entries (`__MACOSX`, `.DS_Store`) and unsafe paths are skipped.
pub fn extract_zip<R: Read + Seek>(reader: R, dest: &Path) -> Result<(), String> {
    let mut archive =
        zip::ZipArchive::new(reader).map_err(|e| format!("Failed to read crate archive: {e}"))?;
    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|e| format!("Failed to read crate archive: {e}"))?;
        let Some(entry_name) = entry.enclosed_name() else {
            continue;
        };
        let name = entry_name.to_string_lossy().replace('\\', "/");
        if is_ignored_entry(&name) {
            continue;
        }
        let target = dest.join(&entry_name);
        if entry.is_dir() {
            fs::create_dir_all(&target)
                .map_err(|e| format!("Failed to create directory {}: {e}", target.display()))?;
        } else {
            let parent = target
                .parent()
                .ok_or_else(|| format!("Invalid entry path: {name}"))?;
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory {}: {e}", parent.display()))?;
            let mut out = fs::File::create(&target)
                .map_err(|e| format!("Failed to create {}: {e}", target.display()))?;
            io::copy(&mut entry, &mut out).map_err(|e| format!("Failed to extract {name}: {e}"))?;
            #[cfg(unix)]
            if let Some(mode) = entry.unix_mode() {
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(&target, fs::Permissions::from_mode(mode));
            }
        }
    }
    Ok(())
}

/// Recursively list all entries below `root`, relative to `root`.
/// Directory paths carry a trailing `/`, matching the OPFS backend convention.
pub fn list_recursive(root: &Path) -> Result<Vec<String>, String> {
    if !root.exists() {
        return Err(format!("Path does not exist: {}", root.display()));
    }
    let mut entries: Vec<String> = Vec::new();
    let mut stack: Vec<PathBuf> = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let read = fs::read_dir(&dir)
            .map_err(|e| format!("Failed to read directory {}: {e}", dir.display()))?;
        for entry in read {
            let entry =
                entry.map_err(|e| format!("Failed to read directory {}: {e}", dir.display()))?;
            let path = entry.path();
            let relative = path
                .strip_prefix(root)
                .unwrap()
                .to_string_lossy()
                .replace('\\', "/");
            if path.is_dir() {
                entries.push(format!("{relative}/"));
                stack.push(path);
            } else {
                entries.push(relative);
            }
        }
    }
    entries.sort();
    Ok(entries)
}

/// Write the contents of `source` into `file` as a zip archive. When `prefix`
/// is non-empty, all entries are nested inside that directory (ELN layout).
/// The archive contains no entry for `source` itself.
pub fn write_dir_as_zip<W: Write + Seek>(
    source: &Path,
    prefix: &str,
    compressed: bool,
    file: W,
) -> Result<(), String> {
    let mut writer = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(if compressed {
        CompressionMethod::Deflated
    } else {
        CompressionMethod::Stored
    });

    let entries = WalkDir::new(source)
        .sort_by_file_name()
        .into_iter()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to traverse crate directory: {e}"))?;

    if !prefix.is_empty() {
        writer
            .add_directory(format!("{prefix}/"), options)
            .map_err(|e| format!("Failed to write zip entry: {e}"))?;
    }

    for entry in entries {
        let Ok(relative) = entry.path().strip_prefix(source) else {
            continue;
        };
        if relative.as_os_str().is_empty() {
            continue;
        }
        let mut name = relative.to_string_lossy().replace('\\', "/");
        if !prefix.is_empty() {
            name = format!("{prefix}/{name}");
        }
        if is_ignored_entry(&name) {
            continue;
        }
        if entry.file_type().is_dir() {
            writer
                .add_directory(format!("{name}/"), options)
                .map_err(|e| format!("Failed to write zip entry {name}: {e}"))?;
        } else {
            writer
                .start_file(&name, options)
                .map_err(|e| format!("Failed to write zip entry {name}: {e}"))?;
            let mut file = fs::File::open(entry.path())
                .map_err(|e| format!("Failed to read {}: {e}", entry.path().display()))?;
            io::copy(&mut file, &mut writer)
                .map_err(|e| format!("Failed to write zip entry {name}: {e}"))?;
        }
    }

    writer
        .finish()
        .map_err(|e| format!("Failed to finalize zip archive: {e}"))?;
    Ok(())
}

/// Write a zip archive containing a single file at `name`.
pub fn write_single_file_zip<W: Write + Seek>(
    name: &str,
    contents: &[u8],
    compressed: bool,
    file: W,
) -> Result<(), String> {
    let mut writer = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(if compressed {
        CompressionMethod::Deflated
    } else {
        CompressionMethod::Stored
    });
    writer
        .start_file(name, options)
        .map_err(|e| format!("Failed to write zip entry {name}: {e}"))?;
    writer
        .write_all(contents)
        .map_err(|e| format!("Failed to write zip entry {name}: {e}"))?;
    writer
        .finish()
        .map_err(|e| format!("Failed to finalize zip archive: {e}"))?;
    Ok(())
}

/// Zip the contents of `source` into an in-memory buffer.
pub fn zip_dir_to_bytes(source: &Path, prefix: &str, compressed: bool) -> Result<Vec<u8>, String> {
    let mut buffer = io::Cursor::new(Vec::new());
    write_dir_as_zip(source, prefix, compressed, &mut buffer)?;
    Ok(buffer.into_inner())
}

/// Replace `target` with `source`, working around platform differences
/// (`fs::rename` cannot overwrite existing files on Windows).
pub fn replace_file(source: &Path, target: &Path) -> Result<(), String> {
    let result = if cfg!(windows) {
        if target.exists() {
            fs::remove_file(target)
                .map_err(|e| format!("Failed to replace {}: {e}", target.display()))?;
        }
        fs::rename(source, target)
    } else {
        fs::rename(source, target)
    };
    result.map_err(|e| format!("Failed to write crate archive {}: {e}", target.display()))
}

/// Total size in bytes of all files below `path`.
pub fn dir_size(path: &Path) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file())
        .fold(0, |acc, entry| {
            acc + entry.metadata().map(|meta| meta.len()).unwrap_or(0)
        })
}

/// Available disk space in bytes at `path`.
pub fn available_space(path: &Path) -> Result<u64, String> {
    fs2::available_space(path).map_err(|e| format!("Failed to query storage: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_rel_path_rejects_traversal() {
        let root = Path::new("/tmp/crate");
        assert!(resolve_rel_path(root, "../secret.txt").is_err());
        assert!(resolve_rel_path(root, "a/../../secret.txt").is_err());
        assert!(resolve_rel_path(root, "/absolute.txt").is_err());
        assert!(resolve_rel_path(root, "").is_err());
        assert_eq!(
            resolve_rel_path(root, "myData/./sample.csv").unwrap(),
            root.join("myData/sample.csv")
        );
        assert_eq!(
            resolve_rel_path(root, "ro-crate-metadata.json").unwrap(),
            root.join("ro-crate-metadata.json")
        );
    }

    #[test]
    fn zip_round_trip_preserves_layout() {
        let source = tempfile::tempdir().unwrap();
        fs::write(source.path().join("ro-crate-metadata.json"), b"{}").unwrap();
        fs::create_dir(source.path().join("data")).unwrap();
        fs::write(source.path().join("data/sample.csv"), b"a,b\n1,2").unwrap();

        let bytes = zip_dir_to_bytes(source.path(), "", true).unwrap();
        let dest = tempfile::tempdir().unwrap();
        extract_zip(io::Cursor::new(bytes), dest.path()).unwrap();

        assert!(dest.path().join("ro-crate-metadata.json").is_file());
        assert!(dest.path().join("data/sample.csv").is_file());

        let prefix_bytes = zip_dir_to_bytes(source.path(), "Crate", true).unwrap();
        let dest2 = tempfile::tempdir().unwrap();
        extract_zip(io::Cursor::new(prefix_bytes), dest2.path()).unwrap();
        assert!(dest2.path().join("Crate/ro-crate-metadata.json").is_file());
        assert!(!dest2.path().join("ro-crate-metadata.json").exists());
    }
}
