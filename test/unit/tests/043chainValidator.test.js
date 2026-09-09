import { validateChain } from '@common/analysis/chainValidator'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import { buildSurveyWithBaseUnit } from '@test/unit/tests/utils/chainSamplingDesignFixtures'

const { samplingStrategies } = ChainSamplingDesign

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
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({ baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef) })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(false)
    expect(Validation.getErrors(fieldValidation).map((error) => error.key)).toEqual([
      Validation.messageKeys.analysis.firstPhaseCommonAttributeRequired,
    ])
  })

  it('reports no error when the sampling point data method applies', async () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: true })
    const chain = _buildChain({ baseUnitNodeDefUuid: NodeDef.getUuid(baseUnitNodeDef) })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })

  it('reports no error when firstPhaseCommonAttributeUuid is set', async () => {
    const { survey, baseUnitNodeDef } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
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

  it('reports no error when no base unit is selected', async () => {
    const { survey } = buildSurveyWithBaseUnit({ baseUnitKeyIsSamplingPointData: false })
    const chain = _buildChain({ baseUnitNodeDefUuid: null })

    const validation = await validateChain({ chain, defaultLang: 'en', survey })
    const fieldValidation = Validation.getFieldValidation(ChainSamplingDesign.keysProps.firstPhaseCommonAttributeUuid)(
      validation
    )

    expect(Validation.isValid(fieldValidation)).toBe(true)
  })
})
