import React from 'react'
import { connect } from 'react-redux'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import useI18n from '@webapp/commonComponents/hooks/useI18n'
import ProcessingStepCalculationsListItem from './processingStepCalculationsListItem'

import { createProcessingStepCalculation } from '../actions'

const ProcessingStepCalculationsList = props => {
  const {
    processingStep, calculationEditorOpened,
    createProcessingStepCalculation
  } = props

  const calculationSteps = ProcessingStep.getCalculationSteps(processingStep)
  const i18n = useI18n()

  return (
    <div className="form-item">

      {
        !calculationEditorOpened &&
        <div className="form-label processing-step__calculations-label">
          {i18n.t('processingStepView.calculationSteps')}
          <button className="btn-s btn-transparent"
                  onClick={() => createProcessingStepCalculation()}>
            <span className="icon icon-plus icon-14px"/>
          </button>
        </div>
      }

      <div className="processing-step__calculations">
        {
          calculationSteps.map(calculation => (
            <ProcessingStepCalculationsListItem
              key={ProcessingStepCalculation.getIndex(calculation)}
              calculation={calculation}
              calculationEditorOpened={calculationEditorOpened}
            />
          ))
        }
      </div>
    </div>
  )
}

ProcessingStepCalculationsList.defaultProps = {
  processingStep: null
}

export default connect(null, { createProcessingStepCalculation })(ProcessingStepCalculationsList)