export interface IPersistenceAdapter {
    getMetadataGraph(): Promise<string>
    getMetadataContext(): Promise<string>
    updateMetadataGraph(metadata: string): Promise<void>
    updateMetadataContext(context: string): Promise<void>
}
