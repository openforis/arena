/**
 * Tool registry: which tools an area offers, the safe wrapper around execute, conversion for the AI SDK and the
 * WebMCP descriptor.
 */
import { jsonSchema, type ToolSet } from 'ai'
import { z } from 'zod'

import { AiLimits } from '@common/ai/limits'
import { isHostingAllowed, type AiPolicy } from '@common/ai/policy'

import { ALL_TOOLS } from './allTools'
import { AiToolFailure } from './toolFailure'
import type { AiTool, AiToolArea, AiToolContext, AiToolErrorResult } from './types'

export const AI_TOOL_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/

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

/**
 * Limits the JSON size of a tool result: the model gets the first characters and `truncated: true`.
 * @param {unknown} output - Tool output.
 * @param {number} [maxChars] - Maximum JSON length.
 * @returns {unknown} The output (undefined → null) or `{ truncated: true, json }`.
 */
export const limitToolResult = (output: unknown, maxChars: number = AiLimits.assistantToolResultMaxChars): unknown => {
  const value = output === undefined ? null : output
  const json = JSON.stringify(value)
  if (json.length <= maxChars) return value
  return { truncated: true, json: json.slice(0, maxChars) }
}

const toolError = (code: string, message: string, details: Record<string, unknown> = {}): AiToolErrorResult => ({
  error: { code, message, ...details },
})

const isAbortError = (error: unknown): boolean => (error as { name?: string })?.name === 'AbortError'

/**
 * Runs a tool safely: checks the input, turns errors into structured results the model can recover from, limits the
 * result size and honours the abort signal (an abort is re-thrown, so the turn stops).
 * @param {AiTool} tool - The tool.
 * @param {unknown} input - Raw input from the model.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {Promise<unknown>} The result or `{ error: { code, message, … } }`.
 */
export const runTool = async (tool: AiTool, input: unknown, ctx: AiToolContext): Promise<unknown> => {
  ctx.signal.throwIfAborted()
  const parsed = tool.inputSchema.safeParse(input)
  if (!parsed.success) return toolError('invalidInput', z.prettifyError(parsed.error))
  try {
    const output = await tool.execute(parsed.data, ctx)
    ctx.signal.throwIfAborted()
    return limitToolResult(output)
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
 * @returns {ToolSet} The AI SDK tool set.
 */
export const toAiSdkTools = (tools: AiTool[], ctx: AiToolContext): ToolSet => {
  const result: Record<string, unknown> = {}
  for (const tool of tools) {
    result[tool.name] = {
      description: tool.description,
      inputSchema: jsonSchema(toToolJsonSchema(tool) as any),
      execute: (input: unknown) => runTool(tool, input, ctx),
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
