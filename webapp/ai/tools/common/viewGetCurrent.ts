import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import type { AiTool } from '../types'

export const viewGetCurrentTool: AiTool<Record<string, never>> = {
  name: 'view_getCurrent',
  description:
    'Returns where the user is in Arena: the module (e.g. designer, data, analysis), the sub-module and, in the ' +
    'Design area, the name of the selected node definition.',
  inputSchema: z.object({}).strict(),
  area: ['design', 'help', 'analysis'],
  dataClass: 'schema',
  effect: 'read',
  requires: () => true,
  execute: async (_input, ctx) => {
    const { module, subModule, selectedNodeDefUuid } = ctx.getCurrentView()
    // Help has no survey in its context: only the module names
    if (!ctx.survey) return { module, subModule }
    const selected = selectedNodeDefUuid ? Survey.getNodeDefByUuid(selectedNodeDefUuid)(ctx.survey) : null
    return { module, subModule, selectedNodeDef: selected ? NodeDef.getName(selected) : null }
  },
}
