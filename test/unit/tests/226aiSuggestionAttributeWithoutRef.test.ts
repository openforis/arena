import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/definitions'
import { attributeWithoutRefDefinition } from '@webapp/ai/suggestions/definitions/attributeWithoutRef'
import { STATE_DETECTORS } from '@webapp/ai/suggestions/detectors'
import {
  attributeWithoutRefDetector,
  detectAttributeWithoutRef,
} from '@webapp/ai/suggestions/detectors/attributeWithoutRef'
import { getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  TEST_NOW,
  buildRefSurvey,
  buildSuggestion,
  createDetectorContext,
  describeContext,
  withNodeDef,
  withSavedNodeDefs,
} from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// region: code without category; species: taxon without taxonomy; calc_code: analysis (not eligible)
beforeAll(async () => {
  survey = withSavedNodeDefs(await buildRefSurvey())
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))
const detect = (target: any) => detectAttributeWithoutRef(createDetectorContext({ survey: target }))
const targetsOf = (target: any) => (detect(target)[0]?.targets ?? []).map((item) => item.key)
const published = (target: any, name: string) =>
  withNodeDef(target, name, (nodeDef) => ({ ...nodeDef, published: true }))

describe('attribute without a category or taxonomy detector (226)', () => {
  test('one suggestion over the whole survey, in hierarchy order', () => {
    expect(detect(survey)).toEqual([
      {
        id: 'attributeWithoutRef:survey',
        kind: 'attributeWithoutRef',
        area: 'design',
        surveyId: 7,
        cycle: null,
        targets: [{ key: uuidOf('region') }, { key: uuidOf('species') }],
        createdAt: TEST_NOW.toISOString(),
        expiresAt: null,
      },
    ])
  })

  test('a published attribute is left out, unless the survey is a template', () => {
    const regionPublished = published(survey, 'region')
    expect(targetsOf(regionPublished)).toEqual([uuidOf('species')])
    expect(targetsOf({ ...regionPublished, template: true })).toEqual([uuidOf('region'), uuidOf('species')])
  })

  test('the parent code of another code attribute is left out', () => {
    const parentCode = withNodeDef(survey, 'country', (nodeDef) =>
      NodeDef.assocProp({ key: 'parentCodeDefUuid', value: uuidOf('region') })(nodeDef)
    )
    expect(targetsOf(parentCode)).toEqual([uuidOf('species')])
  })

  test('nothing when every attribute has its list, for unsaved ones, or when detectors must not run', () => {
    const categoryUuid = Category.getUuid(Survey.getCategoryByName('land_use')(survey))
    const taxonomyUuid = Taxonomy.getUuid(Survey.getTaxonomyByName('trees')(survey))
    let assigned = withNodeDef(survey, 'region', (nodeDef) =>
      NodeDef.assocProp({ key: 'categoryUuid', value: categoryUuid })(nodeDef)
    )
    assigned = withNodeDef(assigned, 'species', (nodeDef) =>
      NodeDef.assocProp({ key: 'taxonomyUuid', value: taxonomyUuid })(nodeDef)
    )
    expect(detect(assigned)).toEqual([])
    const unsaved = withNodeDef(survey, 'region', (nodeDef) => ({ ...nodeDef, temporary: true }))
    expect(targetsOf(unsaved)).toEqual([uuidOf('species')])
    expect(detectAttributeWithoutRef(createDetectorContext({ survey, draft: false }))).toEqual([])
    expect(detectAttributeWithoutRef(createDetectorContext({ survey, canEditSurvey: false }))).toEqual([])
  })

  test('is registered as a Design state detector that needs the draft', () => {
    expect(STATE_DETECTORS).toContain(attributeWithoutRefDetector)
    expect(attributeWithoutRefDetector).toMatchObject({ kind: 'attributeWithoutRef', area: 'design', needsDraft: true })
  })
})

describe('attribute without a category or taxonomy card and prompt (226)', () => {
  test('one attribute: its name and what it lacks; several: the count', () => {
    const region = buildSuggestion('attributeWithoutRef', 'survey', [uuidOf('region')])
    expect(attributeWithoutRefDefinition.card(region, describeContext(survey))).toEqual({
      key: 'attributeWithoutRef.cardCategory',
      params: { name: 'region' },
    })
    const species = buildSuggestion('attributeWithoutRef', 'survey', [uuidOf('species')])
    expect(attributeWithoutRefDefinition.card(species, describeContext(survey))).toEqual({
      key: 'attributeWithoutRef.cardTaxonomy',
      params: { name: 'species' },
    })
    const both = buildSuggestion('attributeWithoutRef', 'survey', [uuidOf('region'), uuidOf('species')])
    expect(attributeWithoutRefDefinition.card(both, describeContext(survey))).toEqual({
      key: 'attributeWithoutRef.card',
      params: { count: 2 },
    })
  })

  test('the prompt names the visible targets with their type', () => {
    const both = buildSuggestion('attributeWithoutRef', 'survey', [uuidOf('region'), uuidOf('species')])
    expect(attributeWithoutRefDefinition.prompt(both, describeContext(survey))).toBe(
      'These attributes have no category or taxonomy: "region" (code), "species" (taxon). List the categories with ' +
        'categories_list and the taxonomies with taxonomies_list, then propose the best match for each with ' +
        'nodeDef_proposeUpdate (prop categoryName or taxonomyName). If none fits, say so and suggest creating one ' +
        'in the category or taxonomy editor.'
    )
  })

  test('is registered', () => {
    expect(SUGGESTION_DEFINITIONS.attributeWithoutRef).toBe(attributeWithoutRefDefinition)
  })
})
