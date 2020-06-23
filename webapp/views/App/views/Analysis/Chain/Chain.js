import React from 'react'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'

import * as Chain from '@common/analysis/processingChain'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/buttonRStudio'
import ButtonBar from '@webapp/loggedin/modules/analysis/chain/view/components/buttonBar'

import { useSurveyInfo } from '@webapp/store/survey'

import { useChain } from './store'

import StepList from './StepList'
import Step from './Step'

const ChainComponent = () => {
  const {
    chain,
    dirty,
    editingStep,
    step,
    calculation,
    editingCalculation,
    onUpdate,
    onSave,
    onDismiss,
    onNewStep,
    onSelectStep,
    onUpdateStep,
    onDeleteStep,
    onNewCalculation,
    onMoveCalculation,
    onDeleteCalculation,
  } = useChain()
  const validation = Chain.getValidation(chain)

  const surveyInfo = useSurveyInfo()
  return (
    <div className={`chain ${editingStep ? 'show-step' : ''}`}>
      <ButtonRStudio onClick={onDismiss} disabled={Survey.isDraft(surveyInfo) || dirty} />

      <div className="form">
        <LabelsEditor
          labels={Chain.getLabels(chain)}
          formLabelKey="processingChainView.formLabel"
          readOnly={editingStep}
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
        chain={chain}
        step={step}
        calculation={calculation}
        editingStep={editingStep}
        editingCalculation={editingCalculation}
        onUpdateStep={onUpdateStep}
        onDeleteStep={onDeleteStep}
        onNewCalculation={onNewCalculation}
        onMoveCalculation={onMoveCalculation}
        onDeleteCalculation={onDeleteCalculation}
      />

      <ButtonBar dirty={dirty} onDismiss={onDismiss} onSave={onSave} />
    </div>
  )
}

export default ChainComponent
