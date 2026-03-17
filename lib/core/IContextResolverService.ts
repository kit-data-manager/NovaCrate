export interface IContextResolverService {
    resolve(id: string): string | null
    reverse(url: string): string | null
}
