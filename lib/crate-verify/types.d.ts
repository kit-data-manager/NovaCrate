declare type JSON_LD_Node = Record<string, string | number | Reference> & {"@id": string, "@type": string}

declare interface Reference {
    "@id": string
}
