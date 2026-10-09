import { z } from 'zod'

import { AI_TOOL_NAME_PATTERN, getTools, toWebMcpDescriptor } from '@webapp/ai/tools/registry'
import type { AiTool } from '@webapp/ai/tools/types'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'

const makeTool = (name: string, overrides: Partial<AiTool> = {}): AiTool => ({
  name,
  description: `${name} tool`,
  inputSchema: z.object({ text: z.string().describe('Text to look for') }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: () => true,
  execute: async () => ({ ok: true }),
  ...overrides,
})

const readTool = makeTool('design_read')
const editTool = makeTool('design_propose', { effect: 'propose', requires: (ctx) => ctx.canEditSurvey })
const helpTool = makeTool('help_read', { area: ['help', 'design'] })
const dataTool = makeTool('data_read', { area: ['design'], dataClass: 'data' })
const tools = [readTool, editTool, helpTool, dataTool]

const cloud = { schema: 'cloud', data: 'onDevice' } as const

const names = (list: AiTool[]) => list.map((tool) => tool.name)

describe('getTools', () => {
  test('filters by area', () => {
    const ctx = createToolContext()
    expect(names(getTools({ area: 'help', ctx, effective: cloud, hostingClass: 'cloud', tools }))).toEqual([
      'help_read',
    ])
  })

  test('filters by permission (requires)', () => {
    const ctx = createToolContext({ canEditSurvey: false })
    expect(names(getTools({ area: 'design', ctx, effective: cloud, hostingClass: 'cloud', tools }))).toEqual([
      'design_read',
      'help_read',
    ])
  })

  test('policy filtering: a data class the hosting class may not see is never offered', () => {
    const ctx = createToolContext()
    expect(names(getTools({ area: 'design', ctx, effective: cloud, hostingClass: 'cloud', tools }))).toEqual([
      'design_read',
      'design_propose',
      'help_read',
    ])
    const dataInCloud = { schema: 'cloud', data: 'cloud' } as const
    expect(getTools({ area: 'design', ctx, effective: dataInCloud, hostingClass: 'cloud', tools })).toHaveLength(4)
  })

  test('policy filtering: nothing for an unknown hosting class, a refused class or no policy', () => {
    const ctx = createToolContext()
    expect(getTools({ area: 'design', ctx, effective: cloud, hostingClass: null, tools })).toEqual([])
    const orgOnly = { schema: 'orgHosted', data: 'off' } as const
    expect(getTools({ area: 'design', ctx, effective: orgOnly, hostingClass: 'cloud', tools })).toEqual([])
    expect(getTools({ area: 'design', ctx, effective: null, hostingClass: 'cloud', tools })).toEqual([])
  })
})

describe('toWebMcpDescriptor', () => {
  test('has the WebMCP shape, read-only hint included for propose tools', () => {
    const descriptor = toWebMcpDescriptor(editTool)
    expect(Object.keys(descriptor).sort()).toEqual(['annotations', 'description', 'inputSchema', 'name'])
    expect(descriptor.name).toBe('design_propose')
    expect(descriptor.annotations).toEqual({ readOnlyHint: true })
    expect(descriptor.inputSchema).toMatchObject({
      type: 'object',
      properties: { text: { type: 'string', description: 'Text to look for' } },
      required: ['text'],
    })
  })

  test('the name pattern accepts provider-safe names only', () => {
    expect(AI_TOOL_NAME_PATTERN.test('docs_search')).toBe(true)
    expect(AI_TOOL_NAME_PATTERN.test('nodeDef_proposeCreate')).toBe(true)
    expect(AI_TOOL_NAME_PATTERN.test('docs.search')).toBe(false)
    expect(AI_TOOL_NAME_PATTERN.test('1tool')).toBe(false)
    expect(AI_TOOL_NAME_PATTERN.test(`a${'b'.repeat(64)}`)).toBe(false)
  })
})
