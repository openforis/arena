/**
 * First line of each assistant system prompt. The mock provider picks its scripted turns by this marker (the
 * feature key doesn't reach the provider); for real models it is a harmless tag.
 */
export const assistantMarkers = {
  design: '[arena-assistant:design]',
  help: '[arena-assistant:help]',
} as const
