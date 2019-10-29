import './processingChainSteps.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'

import {
  createProcessingStep,
  fetchProcessingSteps,
  navigateToProcessingStepView
} from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainSteps = props => {
  const {
    history, processingChain,
    createProcessingStep, fetchProcessingSteps, navigateToProcessingStepView
  } = props
  const i18n = useI18n()

  const processingSteps = ProcessingChain.getProcessingSteps(processingChain)

  useEffect(() => {
    fetchProcessingSteps(ProcessingChain.getUuid(processingChain))
  }, [])

  return (
    <div className="form-item">
      <div className="form-label processing-chain__steps-label">
        {i18n.t('processingChainView.processingSteps')}
        <button className="btn-s btn-transparent" onClick={() => createProcessingStep(history)}>
          <span className="icon icon-plus icon-14px"/>
        </button>
      </div>

      <div className="processing-chain__steps">
        {
          processingSteps.map(step => {
              const index = ProcessingStep.getIndex(step)
              return (
                <div key={index} className="processing-chain__step"
                     onClick={() => navigateToProcessingStepView(history, ProcessingStep.getUuid(step))}>
                  <div className="processing-chain__step-index">
                    {index + 1}
                  </div>
                  <div className="processing-chain__step-content">
                    <div>{ProcessingStep.getEntityUuid(step)}</div>
                    <span className="icon icon-pencil2 icon-10px icon-edit"/>
                  </div>
                </div>
              )
            }
          )
        }
      </div>
    </div>
  )

}

ProcessingChainSteps.defaultProps = {
  processingChain: null,
}

export default connect(
  null,
  { createProcessingStep, fetchProcessingSteps, navigateToProcessingStepView }
)(ProcessingChainSteps)
