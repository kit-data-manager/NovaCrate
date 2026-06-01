/**
 * Copyright 2023 Vercel, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Agent,
    ChatTransport,
    convertToModelMessages,
    DirectChatTransportOptions,
    InferUITools,
    Output,
    ToolSet,
    UIMessage,
    UIMessageChunk,
    UIMessageStreamOptions,
    validateUIMessages
} from "ai"

/**
 * A transport that directly communicates with an Agent in-process,
 * without going through HTTP. This is useful for:
 * - Server-side rendering scenarios
 * - Testing without network
 * - Single-process applications
 *
 * @example
 * ```tsx
 * import { useChat } from '@ai-sdk/react';
 * import { DirectChatTransport } from 'ai';
 * import { myAgent } from './my-agent';
 *
 * const { messages, sendMessage } = useChat({
 *   transport: new DirectChatTransport({ agent: myAgent }),
 * });
 * ```
 */
export class DynamicDirectChatTransport<
    CALL_OPTIONS = never,
    TOOLS extends ToolSet = {},
    OUTPUT extends Output.Output = never,
    UI_MESSAGE extends UIMessage<unknown, never, InferUITools<TOOLS>> = UIMessage<
        unknown,
        never,
        InferUITools<TOOLS>
    >
> implements ChatTransport<UI_MESSAGE> {
    private agent: () => Agent<CALL_OPTIONS, TOOLS, OUTPUT> | undefined | null
    private readonly agentOptions: CALL_OPTIONS | undefined
    private readonly uiMessageStreamOptions: Omit<UIMessageStreamOptions<UI_MESSAGE>, "onFinish">

    constructor({
        agent,
        options,
        ...uiMessageStreamOptions
    }: Omit<DirectChatTransportOptions<CALL_OPTIONS, TOOLS, OUTPUT, UI_MESSAGE>, "agent"> & {
        agent: () => Agent<CALL_OPTIONS, TOOLS, OUTPUT> | undefined | null
    }) {
        this.agent = agent
        this.agentOptions = options
        this.uiMessageStreamOptions = uiMessageStreamOptions
    }

    async sendMessages({
        messages,
        abortSignal
    }: Parameters<ChatTransport<UI_MESSAGE>["sendMessages"]>[0]): Promise<
        ReadableStream<UIMessageChunk>
    > {
        const agent = this.agent()
        if (!agent) throw new Error("No agent available. Please select a provider and a model.")

        // Validate the incoming UI messages
        const validatedMessages = await validateUIMessages<UI_MESSAGE>({
            messages,
            tools: agent.tools
        })

        // Convert UI messages to model messages
        const modelMessages = await convertToModelMessages(validatedMessages, {
            tools: agent.tools
        })

        // Stream from the agent
        const result = await agent.stream({
            prompt: modelMessages,
            abortSignal,
            ...(this.agentOptions !== undefined ? { options: this.agentOptions } : {})
        } as Parameters<Agent<CALL_OPTIONS, TOOLS, OUTPUT>["stream"]>[0])

        // Return the UI message stream
        return result.toUIMessageStream(this.uiMessageStreamOptions)
    }

    /**
     * Direct transport does not support reconnection since there is no
     * persistent server-side stream to reconnect to.
     *
     * @returns Always returns `null`
     */
    async reconnectToStream(
        _options: Parameters<ChatTransport<UI_MESSAGE>["reconnectToStream"]>[0]
    ): Promise<ReadableStream<UIMessageChunk> | null> {
        return null
    }
}
