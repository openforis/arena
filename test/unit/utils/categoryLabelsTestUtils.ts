import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'

import type { ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import {
  CATEGORY_ITEM_LABEL_SET,
  type CategoryItemLabelSetOperation,
} from '@webapp/ai/changeSets/categoryItemLabels/types'
import type { ChangeSet } from '@webapp/ai/changeSets/types'

import * as SB from '@test/utils/surveyBuilder'

import { testUser } from './assistantTestUtils'

/**
 * Builds a survey with categories: cluster > cluster_id (integer, key); categories species (levels genus, species)
 * and land_use (level class). The items are not in the survey: the tools read them from the server.
 * @param {object} [options] - Options.
 * @param {string[]} [options.languages] - Survey languages (default en, fr, es).
 * @param {number} [options.surveyId] - Survey id (default 7).
 * @returns {Promise<object>} The survey.
 */
export const buildCategoryLabelsSurvey = async ({
  languages = ['en', 'fr', 'es'],
  surveyId = 7,
}: { languages?: string[]; surveyId?: number } = {}): Promise<any> => {
  const { integer } = NodeDef.nodeDefType
  const survey: any = await SB.survey(
    testUser,
    SB.entity('cluster', SB.attribute('cluster_id', integer).key().label('Cluster id')).label('Cluster')
  )
    .categories(SB.category('species').levels('genus', 'species'), SB.category('land_use').levels('class'))
    .build()
  // the builder returns the survey info at the top level, without id
  return { ...survey, id: surveyId, props: { ...survey.props, languages } }
}

/**
 * Returns the uuid of a category of the survey.
 * @param {object} survey - Survey.
 * @param {string} name - Category name.
 * @returns {string} The uuid.
 */
export const categoryUuidOf = (survey: any, name: string): string =>
  Category.getUuid(Survey.getCategoryByName(name)(survey))

type CategoryLabelParams = {
  categoryUuid: string
  ref: string
  lang?: string
  text?: string
  expectedText?: string | null
  levelName?: string
}

/**
 * Builds a category item label operation without id (item uuid `item-<ref>`).
 * @param {CategoryLabelParams} params - Parameters (text defaults to `<ref> (<lang>)`).
 * @returns {object} The draft.
 */
export const categoryLabelDraft = ({
  categoryUuid,
  ref,
  lang = 'fr',
  text,
  expectedText = null,
  levelName = 'genus',
}: CategoryLabelParams): Omit<CategoryItemLabelSetOperation, 'id'> => ({
  type: CATEGORY_ITEM_LABEL_SET,
  categoryUuid,
  itemUuid: `item-${ref}`,
  ref,
  levelName,
  lang,
  text: text ?? `${ref} (${lang})`,
  expectedText,
})

/**
 * Builds a category item label operation.
 * @param {CategoryLabelParams & {id?: string}} params - Parameters (id defaults to c1).
 * @returns {CategoryItemLabelSetOperation} The operation.
 */
export const categoryLabelOp = ({
  id = 'c1',
  ...params
}: CategoryLabelParams & { id?: string }): CategoryItemLabelSetOperation => ({ id, ...categoryLabelDraft(params) })

/**
 * Builds a change set of survey 7.
 * @param {object[]} operations - Operations.
 * @param {string} [id] - Change set id.
 * @returns {ChangeSet} The change set.
 */
export const categoryLabelChangeSet = (operations: ChangeSet['operations'], id = 'cs-categories'): ChangeSet => ({
  id,
  surveyId: 7,
  summary: 'Category labels',
  createdAt: '2026-10-11T10:00:00.000Z',
  operations,
})

/**
 * Creates applier dependencies that do nothing, on a fixed survey.
 * @param {object} survey - Survey returned by getSurvey.
 * @param {Partial<ApplierDeps>} [overrides] - Fields to replace.
 * @returns {ApplierDeps} The dependencies.
 */
export const createApplierDepsStub = (survey: any, overrides: Partial<ApplierDeps> = {}): ApplierDeps => ({
  getSurvey: () => survey,
  getCycle: () => '0',
  isSurveyDirty: () => false,
  postNodeDef: async () => undefined,
  putNodeDefProps: async () => undefined,
  onNodeDefCreated: () => undefined,
  onNodeDefUpdated: () => undefined,
  onNodeDefSaved: () => undefined,
  ...overrides,
})
