import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import type { ChangeSet } from '@webapp/ai/changeSets/types'
import type { AiToolContext } from '@webapp/ai/tools/types'

import * as SB from '@test/utils/surveyBuilder'

export const testUser: any = { uuid: 'user-1', name: 'Tester', authGroups: [] }

/**
 * Translation stub: the key followed by the params as JSON.
 * @param {string} key - Key.
 * @param {object} [params] - Params.
 * @returns {string} The "translation".
 */
export const fakeT = (key: string, params?: Record<string, unknown>): string =>
  params && Object.keys(params).length > 0 ? `${key} ${JSON.stringify(params)}` : key

/**
 * Builds the test survey of the assistant tests:
 * cluster (root) > cluster_id (integer, key), cluster_notes (text), plot (multiple) > plot_id (integer, key),
 * tree (multiple, table) > tree_dec_1 (decimal).
 * @param {object} [options] - Options.
 * @param {string[]} [options.languages] - Survey languages (default en).
 * @param {number} [options.surveyId] - Survey id (default 7).
 * @returns {Promise<object>} The survey.
 */
export const buildAssistantSurvey = async ({
  languages = ['en'],
  surveyId = 7,
}: { languages?: string[]; surveyId?: number } = {}): Promise<any> => {
  const { integer, decimal } = NodeDef.nodeDefType
  const survey: any = await SB.survey(
    testUser,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', integer).key().label('Cluster id'),
      SB.attribute('cluster_notes').label('Notes'),
      SB.entity(
        'plot',
        SB.attribute('plot_id', integer).key().label('Plot id'),
        SB.entity('tree', SB.attribute('tree_dec_1', decimal).label('Tree dec 1')).multiple().renderAsTable()
      )
        .multiple()
        .label('Plot')
    ).label('Cluster')
  ).build()
  // the builder returns the survey info at the top level, without id
  return { ...survey, id: surveyId, props: { ...survey.props, languages } }
}

/**
 * Returns the node definition with the given name (scans the array: the name index may be stale in tests).
 * @param {object} survey - Survey.
 * @param {string} name - Name.
 * @returns {object} The node definition.
 */
export const getDefByName = (survey: any, name: string): any => {
  const nodeDef = Survey.getNodeDefsArray(survey).find((def: any) => NodeDef.getName(def) === name)
  if (!nodeDef) throw new Error(`no node def ${name}`)
  return nodeDef
}

/**
 * Creates a tool context for tests (view and edit allowed, English, no Redux).
 * @param {Partial<AiToolContext>} [overrides] - Fields to replace.
 * @returns {AiToolContext & { changeSets: ChangeSet[] }} The context; `changeSets` collects what onChangeSet got.
 */
export const createToolContext = (
  overrides: Partial<AiToolContext> = {}
): AiToolContext & { changeSets: ChangeSet[] } => {
  const changeSets: ChangeSet[] = []
  return {
    getState: () => ({}),
    dispatch: (action: any) => action,
    user: testUser,
    survey: null,
    cycle: '0',
    lang: 'en',
    uiLang: 'en',
    signal: new AbortController().signal,
    canViewSurvey: true,
    canEditSurvey: true,
    getCurrentView: () => ({ module: 'designer', subModule: 'formDesigner', selectedNodeDefUuid: null }),
    t: fakeT,
    onChangeSet: (changeSet: ChangeSet) => changeSets.push(changeSet),
    changeSets,
    ...overrides,
  }
}
