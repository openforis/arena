import './processingChainSteps.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'

import { fetchProcessingSteps } from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainSteps = props => {
  const { processingChain, fetchProcessingSteps } = props
  const i18n = useI18n()

  useEffect(() => {
    fetchProcessingSteps()
  }, [])

  return (
    <div className="form-item">
      <label className="form-label">{i18n.t('processingChainView.processingSteps')}</label>

      <div className="processing-chain__steps">
        {
          ProcessingChain.getProcessingSteps(processingChain).map(step => (
              <div key={ProcessingStep.getIndex(step)} className="processing-chain__step">
                {
                  ProcessingStep.getEntityUuid(step)
                }
              </div>
            )
          )
        }
      </div>
    </div>
  )

}

ProcessingChainSteps.defaultProps = {
  processingChain: null,
}

export default connect(null, { fetchProcessingSteps })(ProcessingChainSteps)
