// TODO: Last created, modified necessary?

declare interface ICrateFile {
    // Absolute path inside the archive, including file name and extension
    filePath: string
    size: number
    // SHA256 hash of the file contents
    sha256: string
}

declare interface ICrateFileWithData extends ICrateFile {
    data: ArrayBuffer
}
