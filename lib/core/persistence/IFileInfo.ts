/**
 * Lightweight descriptor for a single entry in a crate's storage
 */
export interface IFileInfo {
    /** Whether this entry is a regular file or a directory. */
    type: "file" | "directory"
    /** The entry's name (not a full path — just the final path component). */
    name: string
    /** Full path inside the crate to this file */
    path: string
}
