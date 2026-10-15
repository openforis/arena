import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { ValidationSeverity } from '@openforis/arena-core'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/registry'
import { publishErrorsDefinition } from '@webapp/ai/suggestions/definitions/publishErrors'
import { EVENT_DETECTORS, TARGET_RESOLVERS } from '@webapp/ai/suggestions/registry'
import {
  hasPublishErrors,
  publishErrorsDetector,
  publishErrorsResolver,
} from '@webapp/ai/suggestions/detectors/publishErrors'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  buildSuggestion,
  createAddRecorder,
  createDetectorContext,
  describeContext,
  withNodeDef,
  withSavedNodeDefs,
} from '@test/unit/utils/designSuggestionTestUtils'
import { withValidation } from '@test/unit/utils/surveyValidationTestUtils'

const keysEmpty = 'validationErrors:nodeDefEdit.keysEmpty'
const childrenEmpty = 'validationErrors:nodeDefEdit.childrenEmpty'

let survey: any

beforeAll(async () => {
  survey = withSavedNodeDefs(await buildAssistantSurvey())
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))

const errorOn = (field: string, key: string) =>
  Validation.newInstance(false, { [field]: Validation.newInstance(false, {}, [ValidationResult.newInstance(key)]) })

const warningOnly = () =>
  Validation.newInstance(true, {
    name: Validation.newInstance(
      true,
      {},
      [],
      [ValidationResult.newInstance('validationErrors:nodeDefEdit.nameInvalid', null, ValidationSeverity.warning)]
    ),
  })

const clickPublish = (target: any, { draft = true }: { draft?: boolean } = {}) => {
  const { store, added } = createAddRecorder()
  publishErrorsDetector.handle({ type: 'publishClicked' }, createDetectorContext({ survey: target, store, draft }))
  return added
}

describe('errors before publishing detector (229)', () => {
  test('errors count, at any field (children included); warnings do not', () => {
    const validated = withValidation(survey, {
      tree: errorOn('children', childrenEmpty),
      plot: warningOnly(),
    })
    expect(hasPublishErrors(validated, getDefByName(validated, 'tree'))).toBe(true)
    expect(hasPublishErrors(validated, getDefByName(validated, 'plot'))).toBe(false)
    expect(hasPublishErrors(validated, getDefByName(validated, 'cluster_id'))).toBe(false)
  })

  test('on publish, adds the entries with errors in hierarchy order', () => {
    const validated = withValidation(survey, {
      tree: errorOn('children', childrenEmpty),
      plot: errorOn('keyAttributes', keysEmpty),
      cluster_id: warningOnly(),
    })
    const added = clickPublish(validated)
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ id: 'publishErrors:survey', kind: 'publishErrors', area: 'design' })
    expect(added[0].targets).toEqual([{ key: uuidOf('plot') }, { key: uuidOf('tree') }])
  })

  test('the real validator: an entity without a key is an error', async () => {
    const validated = Survey.assocNodeDefsValidation(await SurveyValidator.validateNodeDefs(survey))(survey)
    const [suggestion] = clickPublish(validated)
    expect(suggestion.targets).toContainEqual({ key: uuidOf('tree') })
    expect(suggestion.targets).not.toContainEqual({ key: uuidOf('plot') })
  })

  test('nothing without errors, for unsaved entries, outside the draft or on another event', () => {
    expect(clickPublish(withValidation(survey, { plot: warningOnly() }))).toEqual([])
    const unsaved = withNodeDef(
      withValidation(survey, { tree: errorOn('children', childrenEmpty) }),
      'tree',
      (nodeDef) => ({ ...nodeDef, temporary: true })
    )
    expect(clickPublish(unsaved)).toEqual([])
    expect(
      clickPublish(withValidation(survey, { tree: errorOn('children', childrenEmpty) }), { draft: false })
    ).toEqual([])
    const { store, added } = createAddRecorder()
    const validated = withValidation(survey, { tree: errorOn('children', childrenEmpty) })
    publishErrorsDetector.handle(
      { type: 'designerLeft', newNodeDefUuids: [uuidOf('tree')] },
      createDetectorContext({ survey: validated, store })
    )
    expect(added).toEqual([])
  })

  test('the resolver drops entries that no longer have errors, or are gone', () => {
    const validated = withValidation(survey, { tree: errorOn('children', childrenEmpty) })
    expect(publishErrorsResolver.isResolved(uuidOf('tree'), validated)).toBe(false)
    expect(publishErrorsResolver.isResolved(uuidOf('tree'), withValidation(survey, { tree: warningOnly() }))).toBe(true)
    expect(publishErrorsResolver.isResolved('no-such-uuid', validated)).toBe(true)
  })

  test('is registered as a Design event detector on publishClicked, with its resolver', () => {
    expect(EVENT_DETECTORS).toContain(publishErrorsDetector)
    expect(publishErrorsDetector).toMatchObject({
      kind: 'publishErrors',
      area: 'design',
      needsDraft: true,
      on: ['publishClicked'],
    })
    expect(TARGET_RESOLVERS).toContain(publishErrorsResolver)
  })
})

describe('errors before publishing card and prompt (229)', () => {
  test('the card counts the entries; the prompt names them and points to survey_getValidation', () => {
    const suggestion = buildSuggestion('publishErrors', 'survey', [uuidOf('plot'), uuidOf('tree')])
    expect(publishErrorsDefinition.card(suggestion, describeContext(survey))).toEqual({
      key: 'publishErrors.card',
      params: { count: 2 },
    })
    expect(publishErrorsDefinition.prompt(suggestion, describeContext(survey))).toBe(
      'The survey has validation errors that block publishing, in: "plot", "tree". Read them with ' +
        "survey_getValidation and propose fixes. Leave errors you can't fix to me, and say what to do."
    )
    expect(SUGGESTION_DEFINITIONS.publishErrors).toBe(publishErrorsDefinition)
  })
})
