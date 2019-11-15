import React from 'react'
import { connect } from 'react-redux'

import useI18n from '@webapp/commonComponents/hooks/useI18n'

import { createProcessingStepCalculation } from '../actions'

const ProcessingStepCalculations = props => {
  const {
    processingStep,
    createProcessingStepCalculation
  } = props

  const i18n = useI18n()

  return (
    <div className="form-item">

      <div className="form-label processing-step__calculations-label">
        {i18n.t('processingStepView.calculationSteps')}
        <button className="btn-s btn-transparent"
                onClick={() => createProcessingStepCalculation()}>
          <span className="icon icon-plus icon-14px"/>
        </button>
      </div>

    </div>
  )
}

ProcessingStepCalculations.defaultProps = {
  processingStep: null
}

export default connect(null, { createProcessingStepCalculation })(ProcessingStepCalculations)