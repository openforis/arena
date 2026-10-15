/**
 * Card and prompt of the attribute without a reference suggestion (code or taxon attribute without a category or taxonomy).
 */
import * as NodeDef from '@core/survey/nodeDef'

import { buildAttributeWithoutRefPrompt } from '../prompts/designPrompts'
import { getTargetNodeDefs } from './designTargetNames'
import type { SuggestionDefinition } from './types'

export const attributeWithoutRefDefinition: SuggestionDefinition = {
  kind: 'attributeWithoutRef',
  card: (suggestion, ctx) => {
    const nodeDefs = getTargetNodeDefs(suggestion, ctx.survey)
    if (suggestion.targets.length === 1 && nodeDefs.length === 1) {
      const [nodeDef] = nodeDefs
      const key = NodeDef.isTaxon(nodeDef) ? 'attributeWithoutRef.cardTaxonomy' : 'attributeWithoutRef.cardCategory'
      return { key, params: { name: NodeDef.getName(nodeDef) } }
    }
    return { key: 'attributeWithoutRef.card', params: { count: suggestion.targets.length } }
  },
  prompt: (suggestion, ctx) =>
    buildAttributeWithoutRefPrompt({
      entries: getTargetNodeDefs(suggestion, ctx.survey).map((nodeDef) => ({
        name: NodeDef.getName(nodeDef),
        type: NodeDef.getType(nodeDef),
      })),
    }),
}
