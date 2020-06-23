import React from 'react'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'

import * as Chain from '@common/analysis/processingChain'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/buttonRStudio'
import ButtonBar from '@webapp/loggedin/modules/analysis/chain/view/components/buttonBar'

import { useSurveyInfo } from '@webapp/store/survey'

import { useAnalysis } from './store'

import StepList from './StepList'
import Step from './Step'

const ChainComponent = () => {
  const { state: analysisState, actions: analysisActions } = useAnalysis()
  const { chain, dirty, editingStep } = analysisState
  const { chain: chainActions, onSave, openRButton, onDismiss } = analysisActions

  const validation = Chain.getValidation(chain)

  const surveyInfo = useSurveyInfo()
  return (
    <div className={`chain ${editingStep ? 'show-step' : ''}`}>
      <ButtonRStudio onClick={openRButton} disabled={Survey.isDraft(surveyInfo) || dirty} />

      <div className="form">
        <LabelsEditor
          labels={Chain.getLabels(chain)}
          formLabelKey="processingChainView.formLabel"
          readOnly={editingStep}
          validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
          onChange={(labels) => chainActions.update({ name: Chain.keysProps.labels, value: labels })}
        />

        {!editingStep && (
          <>
            <LabelsEditor
              formLabelKey="common.description"
              labels={Chain.getDescriptions(chain)}
              onChange={(descriptions) =>
                chainActions.update({ name: Chain.keysProps.descriptions, value: descriptions })
              }
            />

            <CyclesSelector
              cyclesKeysSelected={Chain.getCycles(chain)}
              onChange={(cycles) => chainActions.update({ name: Chain.keysProps.cycles, value: cycles })}
            />
          </>
        )}

        <StepList analysisState={analysisState} analysisActions={analysisActions} />
      </div>

      <Step analysisState={analysisState} analysisActions={analysisActions} />

      <ButtonBar dirty={dirty} onDismiss={onDismiss} onSave={onSave} />
    </div>
  )
}

export default ChainComponent
