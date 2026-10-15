import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { createFindCategoryItemsTool } from '@webapp/ai/tools/analysis/findCategoryItems'
import { resolveAttributeDefs } from '@webapp/ai/tools/cleaning/cleaningContext'
import { findNodeDefByName } from '@webapp/ai/tools/common/nodeDefLookup'
import {
  canCleanseCurrentSurvey,
  canEditCurrentSurvey,
  canViewCurrentSurvey,
} from '@webapp/ai/tools/common/toolPermissions'
import * as surveyLookup from '@webapp/ai/tools/design/surveyLookup'
import * as analysisToolResults from '@webapp/ai/tools/analysis/toolResults'
import * as cleaningContext from '@webapp/ai/tools/cleaning/cleaningContext'

import {
  newAnalysisToolContext,
  newFakeAnalysisApi,
  runTool,
  userWithoutAccess,
} from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

let survey: any

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

const getDef = (target: any, name: string) =>
  Survey.getNodeDefsArray(target).find((nodeDef: any) => NodeDef.getName(nodeDef) === name)

// replaces a node definition without touching the name index, as a rename in the draft survey may leave it
const replaceDefKeepingIndex = (target: any, name: string, change: (nodeDef: any) => any) => {
  const nodeDef = getDef(target, name)
  return { ...target, nodeDefs: { ...target.nodeDefs, [NodeDef.getUuid(nodeDef)]: change(nodeDef) } }
}

const rename = (target: any, from: string, to: string) =>
  replaceDefKeepingIndex(target, from, (nodeDef) =>
    NodeDef.assocProp({ key: NodeDef.propKeys.name, value: to })(nodeDef)
  )

const withFlag = (target: any, name: string, flag: 'deleted' | 'analysis') =>
  replaceDefKeepingIndex(target, name, (nodeDef) => ({ ...nodeDef, [flag]: true }))

describe('one node definition lookup by name (386)', () => {
  test('uses the current names, not the name index', () => {
    const renamed = rename(survey, 'tree_status', 'status_now')
    expect(NodeDef.getName(findNodeDefByName(renamed, 'status_now'))).toBe('status_now')
    expect(findNodeDefByName(renamed, 'tree_status')).toBeNull()
    // the index still answers the old name: the lookups of the tools must not use it
    expect(Survey.findNodeDefByName('tree_status')(renamed)).toBeTruthy()
  })

  test('skips deleted node definitions, and analysis ones unless asked', () => {
    expect(findNodeDefByName(withFlag(survey, 'dbh', 'deleted'), 'dbh')).toBeNull()
    const analysis = withFlag(survey, 'dbh', 'analysis')
    expect(findNodeDefByName(analysis, 'dbh')).toBeNull()
    expect(findNodeDefByName(analysis, 'dbh', { includeAnalysis: true })).not.toBeNull()
  })

  test('the design lookup is the same one', () => {
    const renamed = rename(survey, 'tree_status', 'status_now')
    expect(() => surveyLookup.requireNodeDefByName(renamed, 'status_now')).not.toThrow()
    expect(() => surveyLookup.requireNodeDefByName(renamed, 'tree_status')).toThrow()
    expect('findNodeDefByName' in surveyLookup).toBe(false)
  })

  test('category_findItems finds a renamed code attribute and not a deleted one', async () => {
    const tool = createFindCategoryItemsTool({ api: newFakeAnalysisApi().api })
    const renamed = rename(survey, 'tree_status', 'status_now')
    const found: any = await runTool(
      tool,
      { attribute: 'status_now', search: 'liv' },
      newAnalysisToolContext({ survey: renamed })
    )
    expect(found.items).toEqual([{ code: 'L', label: 'Live' }])
    const old: any = await runTool(
      tool,
      { attribute: 'tree_status', search: 'liv' },
      newAnalysisToolContext({ survey: renamed })
    )
    expect(old.error.code).toBe('notCodeAttribute')
    const deleted: any = await runTool(
      tool,
      { attribute: 'tree_status', search: 'liv' },
      newAnalysisToolContext({ survey: withFlag(survey, 'tree_status', 'deleted') })
    )
    expect(deleted.error.code).toBe('notCodeAttribute')
  })

  test('the cleaning tools do not resolve a deleted or analysis attribute, and resolve a renamed one', () => {
    const names = ['dbh']
    expect(resolveAttributeDefs({ survey, names }).nodeDefs).toHaveLength(1)
    expect(resolveAttributeDefs({ survey: withFlag(survey, 'dbh', 'deleted'), names }).unknownNames).toEqual(names)
    expect(resolveAttributeDefs({ survey: withFlag(survey, 'dbh', 'analysis'), names }).unknownNames).toEqual(names)
    const renamed = rename(survey, 'dbh', 'dbh_now')
    expect(resolveAttributeDefs({ survey: renamed, names: ['dbh_now'] }).nodeDefs).toHaveLength(1)
    expect(resolveAttributeDefs({ survey: renamed, names }).unknownNames).toEqual(names)
    // an entity is not an attribute
    expect(resolveAttributeDefs({ survey, names: ['tree'] }).unknownNames).toEqual(['tree'])
  })
})

describe('one set of permission helpers (386)', () => {
  test('view and edit follow the survey and the context flags', () => {
    const ctx = (overrides: object) => newAnalysisToolContext({ survey, ...overrides }) as any
    expect(canViewCurrentSurvey(ctx({}))).toBe(true)
    expect(canViewCurrentSurvey(ctx({ canViewSurvey: false }))).toBe(false)
    expect(canViewCurrentSurvey(ctx({ survey: null }))).toBe(false)
    expect(canEditCurrentSurvey(ctx({ canEditSurvey: true }))).toBe(true)
    expect(canEditCurrentSurvey(ctx({ canEditSurvey: false }))).toBe(false)
    expect(canEditCurrentSurvey(ctx({ survey: null, canEditSurvey: true }))).toBe(false)
  })

  test('cleansing needs the data cleanser permission on the survey', () => {
    expect(canCleanseCurrentSurvey(newAnalysisToolContext({ survey }) as any)).toBe(true)
    expect(canCleanseCurrentSurvey(newAnalysisToolContext({ survey, user: userWithoutAccess }) as any)).toBe(false)
    expect(canCleanseCurrentSurvey(newAnalysisToolContext({ survey: null }) as any)).toBe(false)
  })

  test('no module keeps its own copy', () => {
    expect('canViewSurveyTool' in surveyLookup).toBe(false)
    expect('canEditSurveyTool' in surveyLookup).toBe(false)
    expect('canViewCurrentSurvey' in analysisToolResults).toBe(false)
    expect('canCleanseCurrentSurvey' in cleaningContext).toBe(false)
  })
})
