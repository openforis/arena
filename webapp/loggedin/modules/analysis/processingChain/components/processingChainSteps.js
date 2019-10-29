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
      <label className="form-label">{i18n.t('processingChainView.processingSteps')}</label>

      <div className="processing-chain__steps">
        {
          processingSteps.map(step => {
              const index = ProcessingStep.getIndex(step)
              return (
                <div key={index} className="processing-chain__step"
                     onClick={() => navigateToProcessingStepView(history, ProcessingStep.getUuid(step))}>
                  <span className="icon icon-pencil2 icon-10px icon-edit"/>
                  {
                    ProcessingStep.getEntityUuid(step)
                  }
                </div>
              )
            }
          )
        }

        <button className="btn processing-chain__step" onClick={() => createProcessingStep(history)}>
          <span className="icon icon-plus icon-14px"/>
        </button>
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
