import { SurveyFactory, NodeDefFactory, CategoryFactory } from '@openforis/arena-core'

import { validateChain } from '@common/analysis/chainValidator'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

const { samplingStrategies } = ChainSamplingDesign

const _buildSurveyWithBaseUnit = ({ baseUnitKeyIsSamplingPointData }) => {
  let survey = SurveyFactory.createInstance({ name: 'test_survey' })

  const category = CategoryFactory.createInstance({
    props: { name: baseUnitKeyIsSamplingPointData ? Category.samplingPointDataCategoryName : 'other_category' },
  })
  survey = { ...survey, categories: { [category.uuid]: category } }

  const root = NodeDefFactory.createInstance({ type: NodeDef.nodeDefType.entity, props: { name: 'root' } })
  survey = Survey.assocNodeDef({ nodeDef: root })(survey)

  const plot = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.entity,
    nodeDefParent: root,
    props: { name: 'plot', multiple: true },
  })
  survey = Survey.assocNodeDef({ nodeDef: plot })(survey)

  const plotId = NodeDefFactory.createInstance({
    type: NodeDef.nodeDefType.code,
    nodeDefParent: plot,
    props: { name: 'plot_id', key: true, categoryUuid: category.uuid },
  })
  survey = Survey.assocNodeDef({ nodeDef: plotId })(survey)

  return { survey, baseUnitNodeDef: plot }
}

const _buildChain = ({ baseUnitNodeDefUuid, firstPhaseCommonAttributeUuid }) => ({
  props: {
    labels: { en: 'test chain' },
    samplingDesign: {
      samplingStrategy: samplingStrategies.twoPhase,
      baseUnitNodeDefUuid,
      ...(firstPhaseCommonAttributeUuid ? { firstPhaseCommonAttributeUuid } : {}),
    },
  },
})

describe('chainValidator - firstPhaseCommonAttributeUuid required field', () => {
  it('reports an error when required and missing', async () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({ baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef) })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(false)
  })

  it('reports no error when the sampling point data method applies', async () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    const chain = _buildChain({ baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef) })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })

  it('reports no error when firstPhaseCommonAttributeUuid is set', async () => {
    const { survey, baseUnitNodeDef } = _buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({
      baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef),
      firstPhaseCommonAttributeUuid: 'some-uuid',
    })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })
})
