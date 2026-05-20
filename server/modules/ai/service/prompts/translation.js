/**
 * Prompt builder for the survey-label translation feature (Tier 1 #1).
 *
 * The model receives the source language, a list of target languages,
 * one or more items to translate, and an optional glossary of terms
 * already translated elsewhere in the same survey (so vocabulary stays
 * consistent across labels). Output is plain-text JSON, parsed and
 * Zod-validated server-side — we intentionally avoid the SDK's
 * structured-output / response_format=json_object path because tiny
 * local models (LM Studio / Ollama) frequently 400 even on json mode.
 * Plain text + a strict output spec works on every model.
 */
import { pq } from './promptSafety'

const KIND_HINTS = {
  nodeDefLabel: 'a survey field label, displayed next to data-entry inputs',
  nodeDefDescription: 'a longer help text shown to the data collector',
  validationMessage: 'an error message shown when a validation rule fails',
  categoryItemLabel: 'a label for a category / code-list item',
  taxonVernacularName: 'the vernacular (common) name of a species',
  generic: 'a survey-related label',
}

/**
 * Builds the system + user prompt pair for the translation request.
 * @param {object} args - Args.
 * @param {string} args.sourceLang - 2-letter source language code, e.g. "en".
 * @param {string[]} args.targetLangs - 2-letter target language codes.
 * @param {Array<{id:string, text:string, kind?:string}>} args.items - Items to translate.
 * @param {Array<{source:string, byLang: Record<string, string>}>} [args.glossary] - Optional vocabulary anchors from the survey.
 * @param {{message: string}} [args.previousError] - Parser/validator error from a prior attempt, fed back to the LLM.
 * @returns {{ system: string, prompt: string }} The prompt pair.
 */
export const buildTranslationPrompt = ({ sourceLang, targetLangs, items, glossary, previousError }) => {
  const system = `You translate survey labels for the Open Foris Arena platform (FAO field-data
collection). The labels are short, terminologically consistent, and often
domain-specific (forestry, agriculture, biodiversity).

Style:
- Keep translations as concise as the source.
- Preserve units and numbers verbatim.
- Preserve placeholders like {{ }} or %s exactly.
- If the source uses Title Case, mirror it; otherwise use sentence case.
- Use the supplied glossary to keep recurring terminology consistent.

Output format (very important):
Reply with EXACTLY one JSON object, nothing else, in this exact shape:
{
  "translations": [
    { "id": "<original id>", "byLang": { "<langCode>": "<translation>" } }
  ]
}
- Include every item from the request, keyed by its original id.
- Include every requested target language for every item.
- Do not wrap the JSON in code fences or backticks.
- Do not add prose before or after the JSON.`

  const itemsBlock = items
    .map((it, idx) => {
      const kind = it.kind || 'generic'
      const hint = KIND_HINTS[kind] || KIND_HINTS.generic
      return `[${idx + 1}] id=${pq(it.id, 200)} kind=${pq(kind, 64)} (${hint})\n` + `    text: ${pq(it.text)}`
    })
    .join('\n')

  const glossaryBlock =
    glossary && glossary.length > 0
      ? `\nGlossary (existing translations in this survey - reuse exactly when relevant):
${glossary
  .slice(0, 30)
  .map(
    (g) =>
      `- ${pq(g.source, 200)} -> ${Object.entries(g.byLang || {})
        .map(([lang, t]) => `${pq(lang, 16)}: ${pq(t, 200)}`)
        .join(', ')}`
  )
  .join('\n')}`
      : ''

  let prompt = `Source language: ${sourceLang}
Target languages: ${targetLangs.join(', ')}
${glossaryBlock}

Items to translate:
${itemsBlock}

Produce the translations.`

  if (previousError) {
    prompt += `

The previous attempt's output could not be parsed: ${pq(previousError.message)}
Return ONLY the JSON object as specified — no prose, no fences.`
  }

  return { system, prompt }
}
