import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'
import ValidationTooltip from '@webapp/commonComponents/validationTooltip'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { fetchSteps } from '@webapp/loggedin/modules/analysis/chain/actions'
import { createStep } from '@webapp/loggedin/modules/analysis/step/actions'

import StepItem from './stepItem'

const StepList = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const editingStep = useSelector(StepState.isEditingStep)
  const chain = useSelector(ChainState.getProcessingChain)
  const validation = Chain.getItemValidationByUuid(Chain.getUuid(chain))(chain)
  const stepsValidation = Validation.getFieldValidation(Chain.keys.processingSteps)(validation)

  // Fetch steps on mount
  useEffect(() => {
    if (!Chain.isTemporary(chain) && !editingStep) {
      dispatch(fetchSteps(Chain.getUuid(chain)))
    }
  }, [])

  const steps = Chain.getProcessingSteps(chain)
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
            onClick={() => dispatch(createStep())}
            aria-disabled={lastStepHasCategory}
          >
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      <div className="chain-list">
        {steps.map((processingStep) => (
          <StepItem key={Step.getIndex(processingStep)} step={processingStep} />
        ))}
      </div>
    </div>
  )
}

export default StepList
