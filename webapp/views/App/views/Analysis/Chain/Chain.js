import './Chain.scss'

import React from 'react'

import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/processingChain'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'

import ButtonRStudio from '@webapp/components/buttonRStudio'
import ButtonBar from '@webapp/loggedin/modules/analysis/chain/view/components/buttonBar'

import { useChain } from './store'

import StepList from './StepList'
import Step from './Step'

const ChainComponent = () => {
  const {
    chain,
    dirty,
    editingStep,
    step,
    onUpdate,
    onSave,
    onDismiss,
    onNewStep,
    onSelectStep,
    onUpdateStep,
    onDeleteStep,
  } = useChain()
  const validation = Chain.getValidation(chain)

  return (
    <div className="chain">
      <ButtonRStudio onClick={onDismiss} disabled />

      <div className="form">
        <LabelsEditor
          labels={Chain.getLabels(chain)}
          formLabelKey="processingChainView.formLabel"
          readOnly={false}
          validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
          onChange={(labels) => onUpdate({ name: Chain.keysProps.labels, value: labels })}
        />

        {!editingStep && (
          <>
            <LabelsEditor
              formLabelKey="common.description"
              labels={Chain.getDescriptions(chain)}
              onChange={(descriptions) => onUpdate({ name: Chain.keysProps.descriptions, value: descriptions })}
            />

            <CyclesSelector
              cyclesKeysSelected={Chain.getCycles(chain)}
              onChange={(cycles) => onUpdate({ name: Chain.keysProps.cycles, value: cycles })}
            />
          </>
        )}

        <StepList
          chain={chain}
          dirty={dirty}
          editingStep={editingStep}
          step={step}
          onNewStep={onNewStep}
          onSelectStep={onSelectStep}
        />
      </div>

      <Step
        step={step}
        chain={chain}
        editingStep={editingStep}
        onUpdateStep={onUpdateStep}
        onDeleteStep={onDeleteStep}
      />

      <ButtonBar dirty={dirty} onDismiss={onDismiss} onSave={onSave} />
    </div>
  )
}

export default ChainComponent
