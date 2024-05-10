import { useCallback, useEffect, useRef, useState } from "react"

function isEqual<I>(data: I | I[], oldData: I | I[]) {
    if (Array.isArray(data) && Array.isArray(oldData)) {
        if (data.length !== oldData.length) return false
        for (let i = 0; i < data.length; i++) {
            if (!Object.is(data[i], oldData[i])) return false
        }
        return true
    } else {
        return Object.is(data, oldData)
    }
}

export function useAsync<I, O>(
    input: I | null,
    resolver: (input: I) => Promise<O>
): { data: O | undefined; error: string; isPending: boolean; revalidate(): void } {
    const [internalState, setInternalState] = useState<O | undefined>(undefined)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string>("")

    const lastInput = useRef<I | null>(null)

    const action = useCallback(
        (input: I) => {
            setPending(true)

            resolver(input)
                .then((output) => {
                    setInternalState(output)
                    setError("")
                })
                .catch((e) => {
                    console.error("Error in useAsync", e)
                    setError(e + "")
                })
                .finally(() => {
                    setPending(false)
                })
        },
        [resolver]
    )

    useEffect(() => {
        if (isEqual(input, lastInput.current)) return
        lastInput.current = input

        if (input !== null) {
            action(input)
        }
    }, [action, input, resolver])

    return {
        data: internalState,
        error,
        isPending: pending,
        revalidate: () => {
            if (lastInput.current !== null) action(lastInput.current)
        }
    }
}
