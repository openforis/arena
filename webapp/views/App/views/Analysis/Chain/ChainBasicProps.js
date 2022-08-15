import React, { useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import * as API from '@webapp/service/api'

import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

export const ChainBasicProps = (props) => {
  const { updateChain } = props

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()

  const [existsAnotherChainWithSamplingDesign, setExistsAnotherChainWithSamplingDesign] = useState(false)
  const [recordsCountByStep, setRecordsCountByStep] = useState(
    RecordStep.steps.reduce((acc, { id }) => ({ ...acc, [id]: '...' }), {})
  )

  useEffect(() => {
    const fetchChains = async () => {
      const { chains } = await API.fetchChains({ surveyId: Survey.getId(survey) })
      setExistsAnotherChainWithSamplingDesign(
        chains.some((_chain) => Chain.getUuid(_chain) !== Chain.getUuid(chain) && Chain.isSamplingDesign(_chain))
      )
    }

    const fetchRecordCountByStep = async () => {
      const _recordsCountByStep = {} //await API.fetchRecordsCountByStep()
      setRecordsCountByStep(_recordsCountByStep)
    }

    fetchChains()
    fetchRecordCountByStep()
  }, [survey, chain])

  const validation = Chain.getValidation(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

  const samplingDesignDisabled =
    existsAnotherChainWithSamplingDesign || (Chain.isSamplingDesign(chain) && Boolean(baseUnitNodeDef))

  return (
    <>
      <LabelsEditor
        labels={chain.props?.labels}
        formLabelKey="chainView.formLabel"
        readOnly={false}
        validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
        onChange={(labels) => updateChain({ ...chain, props: { ...chain.props, labels } })}
      />
      <LabelsEditor
        formLabelKey="common.description"
        labels={chain.props.descriptions}
        onChange={(descriptions) => updateChain({ ...chain, props: { ...chain.props, descriptions } })}
      />
      <CyclesSelector
        cyclesKeysSelected={chain.props.cycles}
        onChange={(cycles) => updateChain({ ...chain, props: { ...chain.props, cycles } })}
      />
      <FormItem label={i18n.t('chainView.samplingDesign')} className="sampling-design-form-item">
        <Checkbox
          checked={Chain.isSamplingDesign(chain)}
          validation={Validation.getFieldValidation(Chain.keysProps.samplingDesign)(validation)}
          onChange={(samplingDesign) => updateChain(Chain.assocSamplingDesign(samplingDesign)(chain))}
          disabled={samplingDesignDisabled}
        />
      </FormItem>
      <FormItem label={i18n.t('chainView.records')}>
        <div className="records-count-wrapper">
          {RecordStep.steps.map(({ id, name }, index) => (
            <div className="records-count" key={id}>
              {index > 0 && <span>-</span>}
              <span>
                {i18n.t('chainView.recordsInStepCount', {
                  recordsCount: recordsCountByStep[id],
                  step: i18n.t(`surveyForm.step.${name}`),
                })}
              </span>
            </div>
          ))}
        </div>
      </FormItem>
      <FormItem label={i18n.t('chainView.submitOnlyAnalysisStepDataIntoR')}>
        <Checkbox
          checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
          validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(validation)}
          onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
        />
      </FormItem>
    </>
  )
}
