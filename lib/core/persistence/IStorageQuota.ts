/**
 * Snapshot of the storage quota available to the persistence backend.
 *
 * {@link persistent} reflects whether the storage has been granted persistent
 * status (i.e. will not be evicted under storage pressure).
 */
export interface IStorageQuota {
    /** Bytes currently consumed by all crates and their files. */
    usedSpace: number
    /** Total bytes available to the application or the crate. This is up to the persistence implementation */
    totalSpace: number
    /** Whether the storage bucket is persistent. Originally integrated for tracking persistent storage in OPFS */
    persistent: boolean
}
