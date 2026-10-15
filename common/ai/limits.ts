/**
 * Per-feature input caps, enforced by the workflows before a prompt is built.
 * The gateway enforces only the global caps (AI_MAX_PROMPT_CHARS, AI_MAX_OUTPUT_TOKENS).
 */
export const AiLimits = {
  expressionDescriptionMaxChars: 4000,
  expressionMaxChars: 4000,
  expressionErrorMessageMaxChars: 4000,
  dataQueryDescriptionMaxChars: 2000,
  langCodeMaxChars: 16,
  translationMaxItems: 50,
  translationMaxTargetLangs: 20,
  translationItemMaxChars: 2000,
  translationMaxGlossaryEntries: 50,
  translationGlossaryValueMaxChars: 200,
  assistantMessageMaxChars: 8000,
  assistantMaxSteps: 10,
  assistantToolResultMaxChars: 8000,
  assistantConversationsKept: 30,
  // the browser doesn't know the server's AI_MAX_PROMPT_CHARS: its default is the client budget (C: per engine)
  assistantDefaultMaxPromptChars: 200000,
  handbookResultMaxChars: 2000,
  handbookOutlineMaxChars: 3000,
  activityLogMaxEntries: 1000,
  activityLogAggregateKeyMaxChars: 64,
  dataDictionaryBatchSize: 10,
  dataDictionaryMaxDescriptions: 200,
  // longest AI description accepted with a schema summary export (the browser truncates to it)
  dataDictionaryMaxDescriptionChars: 1000,
  // what the server reads from a provider answer: an endpoint chosen by a user must not fill the memory
  providerResponseMaxBytes: 8 * 1024 * 1024,
  providerFrameMaxChars: 1024 * 1024,
  providerErrorBodyMaxBytes: 8 * 1024,
} as const
