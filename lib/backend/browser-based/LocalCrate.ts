let demoCrate: ICrate = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": [
        {
            "@type": "Dataset",
            "@id": "./"
        },
        {
            "@type": "Person",
            "@id": "#christopher-raquet"
        }
    ]
}

export const localCrates: Record<string, ICrate> = {
    democrate: demoCrate
}
