import React from 'react'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

export const ChainBasicProps = (props) => {
  const { updateChain } = props

  const i18n = useI18n()
  const chain = useChain()
  const survey = useSurvey()
  const validation = Chain.getValidation(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

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
          disabled={Chain.isSamplingDesign(chain) && Boolean(baseUnitNodeDef)}
        />
      </FormItem>
    </>
  )
}
