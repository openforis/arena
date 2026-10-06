/**
 * Provider-agnostic text generation, injected into the shared AI tasks: the browser passes a generator backed
 * by the gateway model, the server jobs one backed by modelClient.
 */
export type AiTextRequest = {
  system?: string
  prompt: string
  signal?: AbortSignal
}

export type AiGenerateText = (request: AiTextRequest) => Promise<string>
