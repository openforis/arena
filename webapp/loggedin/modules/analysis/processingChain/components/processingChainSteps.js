import './processingChainSteps.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import ProcessingChainStep from './processingChainStep'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { fetchProcessingSteps } from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { createProcessingStep } from '@webapp/loggedin/modules/analysis/processingStep/actions'
import ProcessingStepView from '@webapp/loggedin/modules/analysis/processingStep/processingStepView'

const ProcessingChainSteps = props => {
  const { processingChain } = props

  const i18n = useI18n()
  const editingStep = useSelector(ProcessingStepState.isEditingStep)
  const dispatch = useDispatch()

  const processingSteps = ProcessingChain.getProcessingSteps(processingChain)
  useEffect(() => {
    if (!ProcessingChain.isTemporary(processingChain)) {
      dispatch(fetchProcessingSteps(ProcessingChain.getUuid(processingChain)))
    }
  }, [])

  return (
    <div className={`form-item${editingStep ? ' processing-chain__steps-editing-step' : ''}`}>
      {!editingStep && (
        <div className="form-label processing-chain__steps-label">
          {i18n.t('processingChainView.processingSteps')}
          <button className="btn-s btn-transparent" onClick={() => dispatch(createProcessingStep())}>
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
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
}

export default ProcessingChainSteps
