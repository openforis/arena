/**
 * Prompt builder for the data-dictionary feature (Tier 1 #7).
 *
 * For node defs that lack a `description` field, we ask the model to
 * draft one based on the field's name, type, parent path, and any
 * category / taxonomy associations. Output is plain-text JSON, parsed
 * and Zod-validated server-side — we intentionally avoid the SDK's
 * structured-output / response_format=json_object path because tiny
 * local models (LM Studio / Ollama) frequently 400 even on json mode.
 */
import { pq } from './promptSafety'

/**
 * Builds the system + user prompt pair for a batch of node defs.
 * @param {object} args - Args.
 * @param {string} args.surveyName - Survey name for context.
 * @param {Array<{uuid:string, name:string, type:string, parentPath?:string, hint?:string}>} args.nodeDefs - Node defs to describe.
 * @param {{message: string}} [args.previousError] - Parser/validator error from a prior attempt, fed back to the LLM.
 * @returns {{ system: string, prompt: string }} The prompt pair.
 */
export const buildDataDictionaryPrompt = ({ surveyName, nodeDefs, previousError }) => {
  const system = `You write concise field descriptions for an Open Foris Arena (FAO) survey
data dictionary. The survey is used for forest, agricultural, or
biodiversity data collection.

Style:
- One sentence per field. 12-25 words. No headings, no markdown.
- Describe what the field captures, not how the user interacts with it.
- Use domain-appropriate vocabulary (DBH, basal area, plot, stratum...) only
  when the field name implies it.
- If the field name is generic ("notes", "remarks", "comments"), give a
  generic but useful description.
- Do not invent units that aren't implied by the name.

Output format (very important):
Reply with EXACTLY one JSON object, nothing else, in this exact shape:
{
  "descriptions": [
    { "uuid": "<original uuid>", "description": "<one-sentence description>" }
  ]
}
- One entry per requested uuid. Do not invent uuids.
- Do not wrap the JSON in code fences or backticks.
- Do not add prose before or after the JSON.`

  const items = nodeDefs
    .map(
      (nd, idx) =>
        `[${idx + 1}] uuid=${pq(nd.uuid, 100)} name=${pq(nd.name, 200)} type=${pq(nd.type, 64)}` +
        (nd.parentPath ? ` parent=${pq(nd.parentPath, 400)}` : '') +
        (nd.hint ? `\n    extra: ${pq(nd.hint, 400)}` : '')
    )
    .join('\n')

  let prompt = `Survey: ${pq(surveyName, 200)}

Fields needing a description:
${items}

Produce one description per field.`

  if (previousError) {
    prompt += `

The previous attempt's output could not be parsed: ${pq(previousError.message)}
Return ONLY the JSON object as specified — no prose, no fences.`
  }

  return { system, prompt }
}
