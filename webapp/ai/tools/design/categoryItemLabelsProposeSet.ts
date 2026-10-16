/**
 * Proposes category item labels. The model refers to items by the refs categoryItems_listMissingLabels
 * gave it in this conversation; the label read then is the expected text the server checks on Apply.
 */
import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { CATEGORY_ITEM_LABEL_TEXT_MAX } from '@common/ai/categoryItemLabels'

import { CATEGORY_ITEM_LABEL_SET } from '@webapp/ai/changeSets/categoryItemLabels/types'
import { findTranslationSource } from '@webapp/ai/changeSets/translationSource'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'

import { canEditCurrentSurvey } from '../common/toolPermissions'
import { AiToolFailure } from '../toolFailure'
import type { AiTool, AiToolContext } from '../types'
import { checkScope, requireCategory } from './categoryItemsListMissingLabels'
import { proposeChangeSet, summarySchema } from './proposeChangeSet'
import { requireSurvey } from './surveyLookup'

const inputSchema = z.object({
  summary: summarySchema,
  items: z
    .array(
      z.object({
        categoryName: z.string().min(1).max(100),
        ref: z.string().trim().min(1).max(500).describe('The ref of a listed item, e.g. "2.14"'),
        lang: z.string().min(2).max(10).describe('A language of the survey'),
        text: z.string().trim().min(1).max(CATEGORY_ITEM_LABEL_TEXT_MAX),
      })
    )
    .min(1)
    .max(200),
})

type CategoryLabelsInput = z.infer<typeof inputSchema>

type CategoryLabelItem = CategoryLabelsInput['items'][number]

// core/survey is untyped JS: getLanguages returns the codes array, default first
const getSurveyLanguages = (survey: any): string[] =>
  Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]

/**
 * Converts one proposed item to an operation draft.
 * @param {CategoryLabelItem} item - Proposed label.
 * @param {object} survey - Survey.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {ChangeOperationDraft} The draft.
 */
const toDraft = (
  { categoryName, ref, lang, text }: CategoryLabelItem,
  survey: any,
  ctx: AiToolContext
): ChangeOperationDraft => {
  const categoryUuid = Category.getUuid(requireCategory(survey, categoryName))
  checkScope(ctx, categoryUuid, categoryName)
  const key = { surveyId: Number(Survey.getId(survey)), categoryUuid, ref }
  if (ctx.categoryItemRefs?.isAmbiguous(key)) {
    throw new AiToolFailure(
      'itemRefAmbiguous',
      `Ref "${ref}" matches more than one item; skip it and tell the user to fix the duplicated codes in the category editor.`,
      { ref }
    )
  }
  const entry = ctx.categoryItemRefs?.get(key) ?? null
  if (!entry) {
    throw new AiToolFailure(
      'itemNotListed',
      `Item "${ref}" of "${categoryName}" was not listed in this conversation: call categoryItems_listMissingLabels ` +
        'first and use the refs it gives.',
      { categoryName, ref }
    )
  }
  return {
    type: CATEGORY_ITEM_LABEL_SET,
    categoryUuid,
    itemUuid: entry.itemUuid,
    ref,
    levelName: entry.levelName,
    lang,
    text,
    expectedText: entry.labels[lang] ?? null,
    source: findTranslationSource({ texts: entry.labels, lang, languages: getSurveyLanguages(survey) }),
  }
}

export const categoryItemLabelsProposeSetTool: AiTool<CategoryLabelsInput> = {
  name: 'categoryItemLabels_proposeSet',
  description:
    'Proposes labels of category items in a survey language (translate category items), up to 200 at once. Use ' +
    'the refs given by categoryItems_listMissingLabels. Shown to the user as a card; nothing is saved until the ' +
    'user applies it.',
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canEditCurrentSurvey,
  execute: async ({ summary, items }, ctx) => {
    const survey = requireSurvey(ctx)
    const drafts = items.map((item) => toDraft(item, survey, ctx))
    return proposeChangeSet({ ctx, drafts, summary })
  },
}
