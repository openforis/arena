import './processingChainSteps.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'
import {
  createProcessingStep,
  fetchProcessingSteps,
} from '@webapp/loggedin/modules/analysis/processingChain/actions'
import ProcessingChainStep from './processingChainStep'

const ProcessingChainSteps = props => {
  const {
    history,
    processingChain,
    createProcessingStep,
    fetchProcessingSteps,
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
        <button
          className="btn-s btn-transparent"
          onClick={() => createProcessingStep(history)}
        >
          <span className="icon icon-plus icon-14px" />
        </button>
      </div>

      <div className="processing-chain__steps">
        {processingSteps.map(processingStep => (
          <ProcessingChainStep
            key={ProcessingStep.getIndex(processingStep)}
            history={history}
            processingStep={processingStep}
          />
        ))}
      </div>
    </div>
  )
}

ProcessingChainSteps.defaultProps = {
  processingChain: null,
}

export default connect(null, { createProcessingStep, fetchProcessingSteps })(
  ProcessingChainSteps,
)
