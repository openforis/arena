import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ObjectUtils from '@core/objectUtils'

import { getBasicPropValue, getUpdatePropValue } from '@webapp/ai/changeSets/operations'
import { nodeDefBasicProps, type ChangeOperationDraft, type NodeDefRefProp } from '@webapp/ai/changeSets/types'

import { canEditCurrentSurvey } from '../common/toolPermissions'
import { AiToolFailure } from '../toolFailure'
import type { AiTool, AiToolContext } from '../types'
import { proposeChangeSet, summarySchema } from './proposeChangeSet'
import { requireNodeDefByName, requireSurvey } from './surveyLookup'

// the model names categories and taxonomies; operations keep uuids
const refInputProps = ['categoryName', 'taxonomyName'] as const

type RefInputProp = (typeof refInputProps)[number]

const updateInputProps = [...nodeDefBasicProps, ...refInputProps] as const

const inputSchema = z.object({
  summary: summarySchema,
  changes: z
    .array(
      z.object({
        nodeDefName: z.string().min(1).max(100),
        prop: z.enum(updateInputProps),
        value: z.union([z.string().min(1).max(100), z.boolean()]),
      })
    )
    .min(1)
    .max(50),
})

type UpdateInput = z.infer<typeof inputSchema>

type UpdateChange = UpdateInput['changes'][number]

type RefTarget = {
  prop: NodeDefRefProp
  nodeDefType: string
  what: string
  listTool: string
  notFoundCode: string
  findByName: (name: string) => (survey: any) => any
}

const refTargets: Record<RefInputProp, RefTarget> = {
  categoryName: {
    prop: 'categoryUuid',
    nodeDefType: NodeDef.nodeDefType.code,
    what: 'category',
    listTool: 'categories_list',
    notFoundCode: 'categoryNotFound',
    findByName: Survey.getCategoryByName,
  },
  taxonomyName: {
    prop: 'taxonomyUuid',
    nodeDefType: NodeDef.nodeDefType.taxon,
    what: 'taxonomy',
    listTool: 'taxonomies_list',
    notFoundCode: 'taxonomyNotFound',
    findByName: Survey.getTaxonomyByName,
  },
}

const STRING_PROPS = new Set<string>(['name', ...refInputProps])

// a node definition name has at most 40 characters; category and taxonomy names may be longer
const NAME_MAX = 40

const isRefInputProp = (prop: string): prop is RefInputProp => (refInputProps as readonly string[]).includes(prop)

/**
 * Refuses a value whose type does not fit the property.
 * @param {UpdateChange} change - The proposed change.
 * @returns {void}
 */
const checkValueType = ({ prop, value }: UpdateChange): void => {
  const expected = STRING_PROPS.has(prop) ? 'string' : 'boolean'
  if (typeof value !== expected) {
    throw new AiToolFailure('invalidInput', `"${prop}" needs a ${expected} value.`)
  }
  if (prop === 'name' && (value as string).length > NAME_MAX) {
    throw new AiToolFailure('invalidInput', `A name has at most ${NAME_MAX} characters.`)
  }
}

/**
 * Converts a category or taxonomy change: checks the node definition type and resolves the name.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @param {UpdateChange} change - The change (prop categoryName or taxonomyName, string value).
 * @returns {ChangeOperationDraft} The draft.
 */
const toRefDraft = (survey: any, nodeDef: any, change: UpdateChange): ChangeOperationDraft => {
  const target = refTargets[change.prop as RefInputProp]
  const type = NodeDef.getType(nodeDef)
  if (type !== target.nodeDefType) {
    throw new AiToolFailure(
      'invalidInput',
      `"${change.prop}" applies only to ${target.nodeDefType} attributes; ${NodeDef.getName(nodeDef)} is ${type}.`
    )
  }
  const name = change.value as string
  const ref = target.findByName(name)(survey)
  if (!ref) {
    throw new AiToolFailure(
      target.notFoundCode,
      `There is no ${target.what} named "${name}". Call ${target.listTool} for the names.`
    )
  }
  return {
    type: 'nodeDef.update',
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    prop: target.prop,
    from: getUpdatePropValue(nodeDef, target.prop),
    to: ObjectUtils.getUuid(ref) as string, // found in the survey: it has a uuid
  }
}

/**
 * Converts the model's changes to update operations, recording the current values.
 * @param {UpdateChange[]} changes - Proposed changes.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {ChangeOperationDraft[]} The drafts, in order.
 */
const toUpdateDrafts = (changes: UpdateChange[], ctx: AiToolContext): ChangeOperationDraft[] => {
  const survey = requireSurvey(ctx)
  return changes.map((change) => {
    checkValueType(change)
    const nodeDef = requireNodeDefByName(survey, change.nodeDefName)
    const { prop } = change
    if (isRefInputProp(prop)) return toRefDraft(survey, nodeDef, change)
    return {
      type: 'nodeDef.update',
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      prop,
      from: getBasicPropValue(nodeDef, prop),
      to: change.value as string | boolean, // checked by checkValueType
    }
  })
}

export const nodeDefProposeUpdateTool: AiTool<UpdateInput> = {
  name: 'nodeDef_proposeUpdate',
  description:
    'Proposes changes to properties of existing node definitions: name (string), key, multiple, readOnly ' +
    '(booleans; readOnly: true requires the node definition to have default values), categoryName (string: the ' +
    'category of a code attribute, from categories_list) and taxonomyName (string: the taxonomy of a taxon ' +
    'attribute, from taxonomies_list). Shown to the user as a card; nothing is saved until the user applies it. ' +
    'Use the current names.',
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canEditCurrentSurvey,
  execute: async ({ summary, changes }, ctx) =>
    proposeChangeSet({ ctx, drafts: toUpdateDrafts(changes, ctx), summary }),
}
