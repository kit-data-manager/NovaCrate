// This file defines a web worker for offloading create-verify into a different thread

import { getPossibleEntityProperties, getPropertyComment, getPropertyRange } from "./helpers"

addEventListener("message", (event) => {
    const msg = event.data as CrateVerifyWorkerCommand

    switch (msg.operation) {
        case "getPropertyComment":
            if (!msg.propertyId) {
                return postMessage({
                    error: "Property ID not specified but required for getPropertyComment",
                    nonce: msg.nonce
                })
            } else {
                try {
                    const data = getPropertyComment(msg.propertyId)
                    return postMessage({ data, nonce: msg.nonce })
                } catch (e) {
                    return postMessage({
                        error: e + "",
                        nonce: msg.nonce
                    })
                }
            }
        case "getPropertyRange":
            if (!msg.propertyId) {
                return postMessage({
                    error: "Property ID not specified but required for getPropertyRange",
                    nonce: msg.nonce
                })
            } else {
                try {
                    const data = getPropertyRange(msg.propertyId)
                    return postMessage({ data, nonce: msg.nonce })
                } catch (e) {
                    return postMessage({
                        error: e + "",
                        nonce: msg.nonce
                    })
                }
            }
        case "getEntityPossibleProperties":
            if (!msg.types) {
                return postMessage({
                    error: "Types not specified but required for getEntityPossibleProperties",
                    nonce: msg.nonce
                })
            } else {
                try {
                    const data = getPossibleEntityProperties(msg.types)
                    return postMessage({ data, nonce: msg.nonce })
                } catch (e) {
                    return postMessage({
                        error: e + "",
                        nonce: msg.nonce
                    })
                }
            }
        default:
            return postMessage({ error: "Unknown operation " + msg.operation, nonce: msg.nonce })
    }
})
