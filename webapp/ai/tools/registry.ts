/**
 * Tool registry: which tools an area offers, the safe wrapper around execute, conversion for the AI SDK and the
 * WebMCP descriptor.
 */
import { jsonSchema, type ToolSet } from 'ai'
import { z } from 'zod'

import { isHostingAllowed, type AiPolicy } from '@common/ai/policy'

import * as Survey from '@core/survey/survey'

import { ALL_TOOLS } from './allTools'
import { TOOL_RESULT_MAX_CHARS, limitToolResult, toolError } from './common/toolResult'
import { AiToolFailure } from './toolFailure'
import type { AiTool, AiToolArea, AiToolContext } from './types'

export const AI_TOOL_NAME_PATTERN = /^[a-zA-Z]\w{0,63}$/

/**
 * Returns the tools the area offers in this context: permission (`requires`) and survey AI policy (the tool's data
 * class must be allowed for the engine's hosting class; nothing when the class or the policy is unknown).
 * @param {object} params - Parameters.
 * @param {AiToolArea} params.area - Assistant area.
 * @param {AiToolContext} params.ctx - Tool context.
 * @param {AiPolicy|null} params.effective - Effective policy (survey, or ceilings without a survey).
 * @param {string|null} params.hostingClass - Hosting class of the engine.
 * @param {AiTool[]} [params.tools] - Candidate tools (default: all tools).
 * @returns {AiTool[]} The tools, in registry order.
 */
export const getTools = ({
  area,
  ctx,
  effective,
  hostingClass,
  tools = ALL_TOOLS,
}: {
  area: AiToolArea
  ctx: AiToolContext
  effective: AiPolicy | null
  hostingClass: string | null
  tools?: AiTool[]
}): AiTool[] => {
  if (!effective) return []
  return tools.filter(
    (tool) =>
      tool.area.includes(area) &&
      isHostingAllowed({ effective, dataClass: tool.dataClass, hostingClass }) &&
      tool.requires(ctx)
  )
}

const isAbortError = (error: unknown): boolean => (error as { name?: string })?.name === 'AbortError'

/**
 * Returns the context of one tool call: the survey is read again, so a call after the user applied a card or edited
 * the survey does not work on the survey of the start of the turn. Another survey is refused: the turn's policy and
 * engine were resolved for the first one, and the abort of the turn comes after React commits.
 * @param {AiToolContext} ctx - Turn context.
 * @returns {AiToolContext} The context of the call.
 */
const toCallContext = (ctx: AiToolContext): AiToolContext => {
  if (!ctx.getSurvey) return ctx
  const survey = ctx.getSurvey()
  const surveyId = (value: AiToolContext['survey']) => (value ? Survey.getId(value) : null)
  if (surveyId(survey) !== surveyId(ctx.survey)) {
    throw new AiToolFailure(
      'surveyChanged',
      'The user switched to another survey while you were working. Do not retry: tell the user to ask again.',
      { messageKey: 'appErrors:aiSurveyChanged' }
    )
  }
  return { ...ctx, survey }
}

/**
 * Turns the text a model sent in place of a list into the list: a JSON array, or names separated by commas.
 * @param {string} text - The text.
 * @returns {unknown[]} The list.
 */
const toList = (text: string): unknown[] => {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // not JSON: names separated by commas
  }
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Returns a copy of the input with the strings sent where the schema expects a list turned into lists.
 * @param {unknown} input - Raw input from the model.
 * @param {object[]} issues - Issues of the failed validation.
 * @returns {unknown} The input to validate again.
 */
const withStringsAsLists = (input: unknown, issues: z.core.$ZodIssue[]): unknown => {
  const fixed: any = structuredClone(input)
  for (const issue of issues) {
    if (issue.code !== 'invalid_type' || issue.expected !== 'array' || issue.path.length === 0) continue
    const parent = issue.path.slice(0, -1).reduce((value: any, key) => value?.[key as PropertyKey], fixed)
    const key = issue.path.at(-1) as PropertyKey
    if (typeof parent?.[key] === 'string') parent[key] = toList(parent[key])
  }
  return fixed
}

// two arguments a small model merged in one key: {"dimensions=[],entity": "tree"}, {"dimensions[],entity": "tree"}
const mergedKey = /^(\w+)[^\w[]*(\[.*\]),(\w+)$/s

/**
 * Drops the double quotes at the start and end of the text (without a regex: /"+$/ backtracks on many quotes).
 * @param {string} text - Text.
 * @returns {string} The text without the surrounding quotes.
 */
const trimQuotes = (text: string): string => {
  let start = 0
  let end = text.length
  while (start < end && text[start] === '"') start++
  while (end > start && text[end - 1] === '"') end--
  return text.slice(start, end)
}

/**
 * Returns a copy of the input with the keys a small model garbles repaired, at any depth: stray quotes around a
 * name are dropped, and a key holding two arguments (name=[...],other) is split in the two.
 * @param {unknown} input - Raw input from the model.
 * @returns {unknown} The input to validate.
 */
const withKeysRepaired = (input: unknown): unknown => {
  if (Array.isArray(input)) return input.map(withKeysRepaired)
  if (!input || typeof input !== 'object') return input
  const fixed: Record<string, unknown> = {}
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = trimQuotes(rawKey)
    const value = withKeysRepaired(rawValue)
    const [, name, json, other] = mergedKey.exec(key) ?? []
    try {
      if (name) fixed[name] = JSON.parse(json)
      fixed[name ? other : key] = value
    } catch {
      // not a value that can be read: the key is kept and the validation refuses it
      fixed[key] = value
    }
  }
  return fixed
}

/**
 * Validates the input of a tool; small models often send a list as a string, which is read as the list.
 * @param {AiTool} tool - The tool.
 * @param {unknown} given - Raw input from the model.
 * @returns {object} The zod result.
 */
const parseInput = (tool: AiTool, given: unknown) => {
  // first: an unknown key is otherwise dropped without an error
  const input = withKeysRepaired(given)
  const parsed = tool.inputSchema.safeParse(input)
  if (parsed.success) return parsed
  // validated again with the same schema: its limits hold
  const retried = tool.inputSchema.safeParse(withStringsAsLists(input, parsed.error.issues))
  return retried.success ? retried : parsed
}

/**
 * Runs a tool safely: checks the input, turns errors into structured results the model can recover from, limits the
 * result size and honours the abort signal (an abort is re-thrown, so the turn stops).
 * @param {AiTool} tool - The tool.
 * @param {unknown} input - Raw input from the model.
 * @param {AiToolContext} ctx - Tool context.
 * @param {number} [maxResultChars] - Cap of the result JSON (default: the wrapper limit).
 * @returns {Promise<unknown>} The result or `{ error: { code, message, … } }`.
 */
export const runTool = async (
  tool: AiTool,
  input: unknown,
  ctx: AiToolContext,
  maxResultChars: number = TOOL_RESULT_MAX_CHARS
): Promise<unknown> => {
  ctx.signal.throwIfAborted()
  const parsed = parseInput(tool, input)
  if (!parsed.success) return toolError('invalidInput', z.prettifyError(parsed.error))
  try {
    const output = await tool.execute(parsed.data, { ...toCallContext(ctx), resultCapChars: maxResultChars })
    ctx.signal.throwIfAborted()
    return limitToolResult(output, maxResultChars)
  } catch (error) {
    if (ctx.signal.aborted || isAbortError(error)) throw error
    if (error instanceof AiToolFailure) return toolError(error.code, error.message, error.details)
    return toolError('toolFailed', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Returns the JSON schema of a tool input, without the `$schema` key (some providers reject it).
 * @param {AiTool} tool - The tool.
 * @returns {object} The JSON schema.
 */
const toToolJsonSchema = (tool: AiTool): Record<string, unknown> => {
  const schema = { ...(z.toJSONSchema(tool.inputSchema) as Record<string, unknown>) }
  delete schema.$schema
  return schema
}

/**
 * Converts tools for streamText. The SDK gets a plain JSON schema (no SDK-side validation): runTool validates, so an
 * invalid input reaches the model as `invalidInput` with the zod message.
 * @param {AiTool[]} tools - The tools.
 * @param {AiToolContext} ctx - Tool context.
 * @param {number} [maxResultChars] - Cap of each result JSON (default: the wrapper limit).
 * @returns {ToolSet} The AI SDK tool set.
 */
export const toAiSdkTools = (
  tools: AiTool[],
  ctx: AiToolContext,
  maxResultChars: number = TOOL_RESULT_MAX_CHARS
): ToolSet => {
  const result: Record<string, unknown> = {}
  for (const tool of tools) {
    result[tool.name] = {
      description: tool.description,
      inputSchema: jsonSchema(toToolJsonSchema(tool) as any),
      execute: (input: unknown) => runTool(tool, input, ctx, maxResultChars),
    }
  }
  return result as ToolSet
}

/**
 * Returns the WebMCP descriptor of a tool. readOnlyHint is true for every tool: propose tools don't write either.
 * @param {AiTool} tool - The tool.
 * @returns {object} `{ name, description, inputSchema, annotations }`.
 */
export const toWebMcpDescriptor = (tool: AiTool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: z.toJSONSchema(tool.inputSchema),
  annotations: { readOnlyHint: true },
})
