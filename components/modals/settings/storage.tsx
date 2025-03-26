import { StorageInfo } from "@/components/storage-info"

export function StoragePage() {
    return (
        <div>
            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">Storage</h3>
            <div className="border rounded mb-4">
                <StorageInfo />
            </div>
        </div>
    )
}
