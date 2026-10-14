/**
 * Provider-agnostic text generation, injected into the shared AI tasks: the browser passes a generator backed by
 * the model of resolveModel (gateway or local server).
 */
export type AiTextRequest = {
  system?: string
  prompt: string
  signal?: AbortSignal
}

export type AiGenerateText = (request: AiTextRequest) => Promise<string>
