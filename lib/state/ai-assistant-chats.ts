import { NC_UIMessage } from "@/lib/ai/types"
import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

interface AIAssistantChat {
    crateId: string
    messages: NC_UIMessage[]
}

// Might be adapted in the future to store a history of chats
interface AIAssistantChats {
    chats: AIAssistantChat[]
    updateChat(crateId: string, messages: NC_UIMessage[]): void
    getChat(crateId: string): AIAssistantChat | undefined
}

export const useAIAssistantChats = create<AIAssistantChats>()(
    ssrSafe(
        immer(
            persist(
                (set, get) => ({
                    chats: [],
                    updateChat(crateId, messages) {
                        set((store) => {
                            const match = store.chats.find((c) => c.crateId === crateId)
                            if (match) {
                                match.messages = messages
                            } else {
                                store.chats.push({
                                    crateId,
                                    messages
                                })
                            }
                        })
                    },
                    getChat(crateId) {
                        return get().chats.find((c) => c.crateId === crateId)
                    }
                }),
                { name: "ai-assistant-chats" }
            )
        )
    )
)
