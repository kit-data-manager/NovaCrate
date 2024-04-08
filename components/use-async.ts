import { useEffect, useRef, useState } from "react"

export function useAsync<I, O>(
    input: I | null,
    resolver: (input: I) => Promise<O>
): { data: O | undefined; error: string; isPending: boolean } {
    const [internalState, setInternalState] = useState<O | undefined>(undefined)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string>("")

    const lastInput = useRef<I | null>(null)

    useEffect(() => {
        if (input == lastInput.current) return
        lastInput.current = input

        if (input !== null) {
            setPending(true)

            resolver(input)
                .then((output) => {
                    setInternalState(output)
                    setError("")
                    console.log("resolved!")
                })
                .catch((e) => {
                    console.error("Error in useAsync", e)
                    setError(e + "")
                })
                .finally(() => {
                    setPending(false)
                })
        }
    }, [input, resolver])

    return { data: internalState, error, isPending: pending }
}
