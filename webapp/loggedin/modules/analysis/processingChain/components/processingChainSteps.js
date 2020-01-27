import './processingChainSteps.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'
import ValidationTooltip from '@webapp/commonComponents/validationTooltip'
import ProcessingChainStep from '@webapp/loggedin/modules/analysis/processingChain/components/processingChainStep'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { fetchProcessingSteps } from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { createProcessingStep } from '@webapp/loggedin/modules/analysis/processingStep/actions'
import ProcessingStepView from '@webapp/loggedin/modules/analysis/processingStep/processingStepView'

const ProcessingChainSteps = props => {
  const { processingChain, validation } = props

  const i18n = useI18n()
  const editingStep = useSelector(ProcessingStepState.isEditingStep)
  const dispatch = useDispatch()

  const processingSteps = ProcessingChain.getProcessingSteps(processingChain)
  useEffect(() => {
    if (!ProcessingChain.isTemporary(processingChain) && !editingStep) {
      dispatch(fetchProcessingSteps(ProcessingChain.getUuid(processingChain)))
    }
  }, [])

  return (
    <div className={`form-item${editingStep ? ' processing-chain__steps-editing-step' : ''}`}>
      {!editingStep && (
        <ValidationTooltip validation={validation}>
          <div className="form-label processing-chain__steps-label">
            {i18n.t('processingChainView.processingSteps')}
            <button className="btn-s btn-transparent" onClick={() => dispatch(createProcessingStep())}>
              <span className="icon icon-plus icon-14px" />
            </button>
          </div>
        </ValidationTooltip>
      )}

      <div className="processing-chain__steps">
        {processingSteps.map(processingStep => (
          <ProcessingChainStep key={ProcessingStep.getIndex(processingStep)} processingStep={processingStep} />
        ))}
      </div>

      {editingStep && <ProcessingStepView />}
    </div>
  )
}

ProcessingChainSteps.defaultProps = {
  processingChain: null,
  validation: null,
}

export default ProcessingChainSteps
