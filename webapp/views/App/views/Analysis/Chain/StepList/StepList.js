import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { useI18n } from '@webapp/store/system'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { State } from '../store'

// import StepItem from './StepItem'

const StepList = (props) => {
  const { state, Actions } = props
  const i18n = useI18n()
  const chainEdit = State.getChainEdit(state)
  const editingStep = Boolean(State.getStepEdit(state))

  const validation = Chain.getItemValidationByUuid(Chain.getUuid(chainEdit))(chainEdit)
  const stepsValidation = Validation.getFieldValidation(Chain.keys.processingSteps)(validation)
  const steps = Chain.getProcessingSteps(chainEdit)
  const lastStepHasCategory = R.pipe(R.last, Step.hasCategory)(steps)

  return (
    <div className={`form-item${editingStep ? ' chain-list__editing-step' : ''}`}>
      {!editingStep && (
        <div className="form-label chain-list__label">
          <ValidationTooltip validation={stepsValidation}>
            {i18n.t('processingChainView.processingSteps')}
          </ValidationTooltip>
          <button
            type="button"
            className="btn-s btn-transparent"
            onClick={() => Actions.createStep({ state })}
            aria-disabled={lastStepHasCategory}
          >
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      {/* <div className="chain-list">
        {steps.map((processingStep) => (
          <StepItem key={Step.getIndex(processingStep)} step={processingStep} state={state} Actions={Actions} />
        ))}
      </div> */}
    </div>
  )
}

StepList.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default StepList
