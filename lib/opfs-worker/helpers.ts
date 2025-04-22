export async function collectAsyncIterator<T>(it: AsyncIterableIterator<T>) {
    const result = []
    for await (const item of it) {
        result.push(item)
    }
    return result
}
