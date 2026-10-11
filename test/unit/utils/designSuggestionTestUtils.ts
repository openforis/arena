import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import type { LabelKind } from '@webapp/ai/changeSets/types'
import type { SuggestionDescribeContext } from '@webapp/ai/suggestions/definitions'
import type { DetectorContext } from '@webapp/ai/suggestions/detectors'
import type { SuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion, SuggestionKind } from '@webapp/ai/suggestions/types'

import * as SB from '@test/utils/surveyBuilder'

import { fakeT, getDefByName, testUser } from './assistantTestUtils'

export const TEST_NOW = new Date('2026-10-11T10:00:00.000Z')

/**
 * Replaces a node definition of the survey with a changed copy.
 * @param {object} survey - Survey.
 * @param {string} name - Node definition name.
 * @param {Function} change - Returns the changed node definition.
 * @returns {object} The updated survey.
 */
export const withNodeDef = (survey: any, name: string, change: (nodeDef: any) => any): any =>
  Survey.assocNodeDef({ nodeDef: change(getDefByName(survey, name)) })(survey)

/**
 * Marks every node definition as saved (the test survey builder leaves them all temporary).
 * @param {object} survey - Survey.
 * @returns {object} The updated survey.
 */
export const withSavedNodeDefs = (survey: any): any =>
  Survey.getNodeDefsArray(survey).reduce(
    (acc: any, nodeDef: any) => Survey.assocNodeDef({ nodeDef: NodeDef.dissocTemporary(nodeDef) })(acc),
    survey
  )

/**
 * Replaces the labels or descriptions of a node definition.
 * @param {object} survey - Survey.
 * @param {string} name - Node definition name.
 * @param {LabelKind} kind - Labels or descriptions.
 * @param {object} texts - The new texts by language (the whole map).
 * @returns {object} The updated survey.
 */
export const withTexts = (survey: any, name: string, kind: LabelKind, texts: Record<string, string>): any =>
  withNodeDef(survey, name, (nodeDef) =>
    kind === 'labels' ? NodeDef.assocLabels(texts)(nodeDef) : NodeDef.assocDescriptions(texts)(nodeDef)
  )

/**
 * Sets the survey languages (the test surveys keep the survey info at the top level).
 * @param {object} survey - Survey.
 * @param {string[]} languages - Languages, default first.
 * @returns {object} The updated survey.
 */
export const withLanguages = (survey: any, languages: string[]): any => ({
  ...survey,
  props: { ...survey.props, languages },
})

/**
 * Creates a store stub that records what the event detectors add.
 * @returns {{store: SuggestionStore, added: AssistantSuggestion[]}} The stub and the added suggestions.
 */
export const createAddRecorder = (): { store: SuggestionStore; added: AssistantSuggestion[] } => {
  const added: AssistantSuggestion[] = []
  const store = {
    add: ({ suggestion }: { userUuid: string; suggestion: AssistantSuggestion }) => {
      added.push(suggestion)
    },
  } as unknown as SuggestionStore
  return { store, added }
}

/**
 * Creates a detector context on a draft generation of survey 7 (cycle 0) of an editor.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {SuggestionStore} [params.store] - Store (default: a recorder).
 * @param {boolean} [params.draft] - Whether the defs are the draft (default true).
 * @param {boolean} [params.canEditSurvey] - Whether the user can edit (default true).
 * @param {boolean} [params.noGeneration] - True for a context without generation.
 * @returns {DetectorContext} The context.
 */
export const createDetectorContext = ({
  survey,
  store = createAddRecorder().store,
  draft = true,
  canEditSurvey = true,
  noGeneration = false,
}: {
  survey: any
  store?: SuggestionStore
  draft?: boolean
  canEditSurvey?: boolean
  noGeneration?: boolean
}): DetectorContext => ({
  userUuid: 'user-1',
  generation: noGeneration
    ? null
    : {
        id: 1,
        userUuid: 'user-1',
        surveyId: 7,
        cycle: '0',
        draft,
        canEditSurvey,
        signal: new AbortController().signal,
      },
  survey,
  availableAreas: ['design'],
  store,
  now: () => TEST_NOW,
})

/**
 * Builds a Design suggestion of survey 7, as the store returns it (visible targets only).
 * @param {SuggestionKind} kind - Kind.
 * @param {string} scopeKey - Id part after the kind.
 * @param {string[]} targetKeys - Target keys.
 * @returns {AssistantSuggestion} The suggestion.
 */
export const buildSuggestion = (kind: SuggestionKind, scopeKey: string, targetKeys: string[]): AssistantSuggestion => ({
  id: `${kind}:${scopeKey}`,
  kind,
  area: 'design',
  surveyId: 7,
  cycle: null,
  targets: targetKeys.map((key) => ({ key })),
  createdAt: TEST_NOW.toISOString(),
  expiresAt: null,
})

/**
 * Creates the context of a card or prompt.
 * @param {object|null} survey - Survey.
 * @param {string} [lang] - Interface language (default en).
 * @returns {SuggestionDescribeContext} The context.
 */
export const describeContext = (survey: any, lang = 'en'): SuggestionDescribeContext => ({ survey, t: fakeT, lang })

/**
 * Builds survey 7 (en) with categories and a taxonomy: cluster > cluster_id (integer, key), country (code, category
 * countries), region (code, no category), species (taxon, no taxonomy), tree_species (taxon, taxonomy trees),
 * calc_code (code, analysis, no category). Categories land_use (class) and countries (country, region); taxonomy trees.
 * @returns {Promise<object>} The survey.
 */
export const buildRefSurvey = async (): Promise<any> => {
  const { code, integer, taxon } = NodeDef.nodeDefType
  const survey: any = await SB.survey(
    testUser,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', integer).key().label('Cluster id'),
      SB.attribute('country', code).category('countries').label('Country'),
      SB.attribute('region', code).label('Region'),
      SB.attribute('species', taxon).label('Species'),
      SB.attribute('tree_species', taxon).taxonomy('trees').label('Tree species'),
      SB.attribute('calc_code', code).analysis().label('Calc code')
    ).label('Cluster')
  )
    .categories(SB.category('land_use').levels('class'), SB.category('countries').levels('country', 'region'))
    .taxonomies(SB.taxonomy('trees').taxa(SB.taxon('ACA', 'Fabaceae', 'Acacia', 'Acacia sp.')))
    .build()
  // the builder returns the survey info at the top level, without id
  return { ...survey, id: 7, props: { ...survey.props, languages: ['en'] } }
}
