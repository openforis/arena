import './chain.scss'
import './chainList.scss'
import './chainListItem.scss'
import './chainForm.scss'

import React from 'react'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/processingChain'

import { useSurveyInfo } from '@webapp/store/survey'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

import { State, useLocalState } from './store'
import StepList from './StepList'
import Step from './Step'
import ButtonBar from './ButtonBar'

const ChainComponent = () => {
  const surveyInfo = useSurveyInfo()
  const { state, Actions } = useLocalState()

  if (state === null) return null

  const chainEdit = State.getChainEdit(state)
  const editingStep = Boolean(State.getStepEdit(state))

  const validation = Chain.getValidation(chainEdit)

  return (
    <div className={`chain ${editingStep ? 'show-step' : ''}`}>
      <ButtonRStudio
        onClick={() => Actions.openRStudio({ state })}
        disabled={Survey.isDraft(surveyInfo) || State.isChainDirty(state)}
      />

      <div className="form">
        <LabelsEditor
          labels={Chain.getLabels(chainEdit)}
          formLabelKey="processingChainView.formLabel"
          readOnly={editingStep}
          validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
          onChange={(labels) => Actions.updateChain({ name: Chain.keysProps.labels, value: labels, state })}
        />

        {!editingStep && (
          <>
            <LabelsEditor
              formLabelKey="common.description"
              labels={Chain.getDescriptions(chainEdit)}
              onChange={(descriptions) =>
                Actions.updateChain({ name: Chain.keysProps.descriptions, value: descriptions, state })
              }
            />

            <CyclesSelector
              cyclesKeysSelected={Chain.getCycles(chainEdit)}
              onChange={(cycles) => Actions.updateCycles({ cycles, state })}
            />
          </>
        )}

        <StepList state={state} Actions={Actions} />
      </div>

      <Step state={state} Actions={Actions} />

      <ButtonBar state={state} Actions={Actions} />
    </div>
  )
}

export default ChainComponent
