import { validateChain } from '@common/analysis/chainValidator'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import { buildSurveyWithBaseUnit } from '@test/unit/tests/utils/chainSamplingDesignFixtures'

const { samplingStrategies } = ChainSamplingDesign

const _buildChain = ({ baseUnitNodeDefUuid, firstPhaseCategoryUuid, firstPhaseCommonAttributeUuid }) => ({
  props: {
    labels: { en: 'test chain' },
    samplingDesign: {
      samplingStrategy: samplingStrategies.twoPhase,
      baseUnitNodeDefUuid,
      firstPhaseCategoryUuid,
      ...(firstPhaseCommonAttributeUuid ? { firstPhaseCommonAttributeUuid } : {}),
    },
  },
})

describe('chainValidator - firstPhaseCommonAttributeUuid required field', () => {
  it('reports an error when required and missing', async () => {
    const { survey, baseUnitNodeDef, otherCategoryUuid } = buildSurveyWithBaseUnit({
      baseUnitKeyIsSamplingPointData: false,
    })
    const chain = _buildChain({
      baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef),
      firstPhaseCategoryUuid: otherCategoryUuid,
    })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(false)
    expect(Validation.getErrors(fieldValidation).map((error) => error.key)).toEqual([
      Validation.messageKeys.analysis.firstPhaseCommonAttributeRequired,
    ])
  })

  it('reports an error when only the base unit is keyed by sampling_point_data (1st phase category is not)', async () => {
    const { survey, baseUnitNodeDef, otherCategoryUuid } = buildSurveyWithBaseUnit({
      baseUnitKeyIsSamplingPointData: true,
    })
    const chain = _buildChain({
      baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef),
      firstPhaseCategoryUuid: otherCategoryUuid,
    })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(false)
  })

  it('reports no error when both the base unit key attribute and the 1st phase category are sampling_point_data', async () => {
    const { survey, baseUnitNodeDef, samplingPointDataCategoryUuid } = buildSurveyWithBaseUnit({
      baseUnitKeyIsSamplingPointData: true,
    })
    const chain = _buildChain({
      baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef),
      firstPhaseCategoryUuid: samplingPointDataCategoryUuid,
    })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })

  it('reports no error when firstPhaseCommonAttributeUuid is set', async () => {
    const { survey, baseUnitNodeDef, otherCategoryUuid } = buildSurveyWithBaseUnit({
      baseUnitKeyIsSamplingPointData: false,
    })
    const chain = _buildChain({
      baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef),
      firstPhaseCategoryUuid: otherCategoryUuid,
      firstPhaseCommonAttributeUuid: 'some-uuid',
    })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })

  it('reports no error when no base unit is selected', async () => {
    const { survey, otherCategoryUuid } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({ baseUnitNodeDefUuid: null, firstPhaseCategoryUuid: otherCategoryUuid })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })
})
