import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { ValidationSeverity } from '@openforis/arena-core'

import { buildAssistantDesignPrompt } from '@common/ai/prompts/assistantDesign'
import { buildAssistantSystemPrompt } from '@webapp/ai/agent/assistantSystemPrompt'
import { collectNodeDefIssues, collectValidationIssues } from '@webapp/ai/changeSets/validationIssues'
import { nodeDefGetTool } from '@webapp/ai/tools/design/nodeDefGet'
import {
  buildSurveyValidation,
  getNodeDefNamesWithIssues,
  surveyGetValidationTool,
} from '@webapp/ai/tools/design/surveyGetValidation'
import { runTool } from '@webapp/ai/tools/registry'
import { buildAssistantSurvey, createToolContext, fakeT } from '@test/unit/utils/assistantTestUtils'
import { withValidation } from '@test/unit/utils/surveyValidationTestUtils'

const { keysEmpty, childrenEmpty } = {
  keysEmpty: 'validationErrors:nodeDefEdit.keysEmpty',
  childrenEmpty: 'validationErrors:nodeDefEdit.childrenEmpty',
}

const entityValidation = () =>
  Validation.newInstance(false, {
    keyAttributes: Validation.newInstance(false, {}, [ValidationResult.newInstance(keysEmpty)]),
    children: Validation.newInstance(false, {}, [ValidationResult.newInstance(childrenEmpty)]),
  })

let survey: any

beforeAll(async () => {
  survey = await buildAssistantSurvey()
})

describe('collectNodeDefIssues', () => {
  test('keeps the entity fields that the proposal check ignores, with the severity', () => {
    const validation = entityValidation()
    expect(collectValidationIssues(validation, fakeT)).toEqual([])
    expect(collectNodeDefIssues(validation, fakeT)).toEqual([
      { field: 'keyAttributes', severity: 'error', message: keysEmpty },
      { field: 'children', severity: 'error', message: childrenEmpty },
    ])
  })

  test('includes warnings', () => {
    const warning = ValidationResult.newInstance(
      'validationErrors:nodeDefEdit.nameInvalid',
      null,
      ValidationSeverity.warning
    )
    const validation = Validation.newInstance(true, {
      name: Validation.newInstance(true, {}, [], [warning]),
    })
    expect(collectNodeDefIssues(validation, fakeT)).toEqual([
      { field: 'name', severity: 'warning', message: 'validationErrors:nodeDefEdit.nameInvalid' },
    ])
  })
})

describe('survey_getValidation', () => {
  test('lists the node definitions with issues, from the real validator', async () => {
    const validation = await SurveyValidator.validateNodeDefs(survey)
    const validated = Survey.assocNodeDefsValidation(validation)(survey)
    const result: any = await runTool(surveyGetValidationTool, {}, createToolContext({ survey: validated }))
    expect(result.truncated).toBe(false)
    const tree = result.nodeDefs.find((entry: any) => entry.name === 'tree')
    expect(tree).toMatchObject({ type: 'entity', path: ['cluster', 'plot'] })
    expect(tree.issues).toContainEqual({ field: 'keyAttributes', severity: 'error', message: keysEmpty })
  })

  test('filters by name; a valid node definition has no issues', async () => {
    const validated = withValidation(survey, { tree: entityValidation() })
    const ctx = createToolContext({ survey: validated })
    const tree: any = await runTool(surveyGetValidationTool, { name: 'tree' }, ctx)
    expect(tree.nodeDefs).toHaveLength(1)
    expect(tree.nodeDefs[0].issues).toHaveLength(2)
    const plot: any = await runTool(surveyGetValidationTool, { name: 'plot' }, ctx)
    expect(plot.nodeDefs).toEqual([{ name: 'plot', type: 'entity', path: ['cluster'], issues: [] }])
    const unknown: any = await runTool(surveyGetValidationTool, { name: 'treee' }, ctx)
    expect(unknown.error.code).toBe('nodeDefNotFound')
  })

  test('no validation: no node definitions', async () => {
    const result: any = await runTool(surveyGetValidationTool, {}, createToolContext({ survey }))
    expect(result).toEqual({ total: 0, truncated: false, nodeDefs: [] })
  })

  test('is capped, with truncated', () => {
    const validated = withValidation(survey, { plot: entityValidation(), tree: entityValidation() })
    const result = buildSurveyValidation({ survey: validated, t: fakeT, maxNodeDefs: 1 })
    expect(result.total).toBe(2)
    expect(result.truncated).toBe(true)
    expect(result.nodeDefs.map((entry: any) => entry.name)).toEqual(['plot'])
  })

  test('names with issues, depth-first', () => {
    const validated = withValidation(survey, { tree: entityValidation(), plot: entityValidation() })
    expect(getNodeDefNamesWithIssues(validated)).toEqual(['plot', 'tree'])
  })

  test('requires an open survey the user can view', () => {
    expect(surveyGetValidationTool.requires(createToolContext({ survey }))).toBe(true)
    expect(surveyGetValidationTool.requires(createToolContext({ survey, canViewSurvey: false }))).toBe(false)
    expect(surveyGetValidationTool.requires(createToolContext())).toBe(false)
  })
})

describe('nodeDef_get', () => {
  test('returns the issues of the node definition', async () => {
    const validated = withValidation(survey, { tree: entityValidation() })
    const ctx = createToolContext({ survey: validated })
    const tree: any = await runTool(nodeDefGetTool, { name: 'tree' }, ctx)
    expect(tree.issues).toHaveLength(2)
    const plot: any = await runTool(nodeDefGetTool, { name: 'plot' }, ctx)
    expect(plot.issues).toEqual([])
  })
})

describe('design prompt', () => {
  const params = {
    uiLang: 'en',
    surveyName: 'forest_inv',
    surveyLabel: 'Forest inventory',
    languages: ['en'],
    cycle: '0',
    viewDescription: null,
  }

  test('names the node definitions with issues and points to survey_getValidation', () => {
    const prompt = buildAssistantDesignPrompt({ ...params, nodeDefNamesWithIssues: ['plot', 'tree'] })
    expect(prompt).toContain('2 node definitions have design errors or warnings: "plot", "tree".')
    expect(prompt).toContain('survey_getValidation')
  })

  test('caps the listed names', () => {
    const names = Array.from({ length: 12 }, (_, index) => `n${index}`)
    const prompt = buildAssistantDesignPrompt({ ...params, nodeDefNamesWithIssues: names })
    expect(prompt).toContain('12 node definitions have design errors or warnings: "n0"')
    expect(prompt).toContain('"n9" and 2 more.')
    expect(prompt).not.toContain('"n10"')
  })

  test('no issues: no line', () => {
    expect(buildAssistantDesignPrompt({ ...params, nodeDefNamesWithIssues: [] })).not.toContain('design errors')
    expect(buildAssistantDesignPrompt(params)).not.toContain('design errors')
  })

  test('the system prompt reads the issues from the survey', () => {
    const validated = withValidation(survey, { tree: entityValidation() })
    const prompt = buildAssistantSystemPrompt({
      area: 'design',
      ctx: createToolContext({ survey: validated }),
      outline: null,
    })
    expect(prompt).toContain('1 node definition has design errors or warnings: "tree".')
  })
})
