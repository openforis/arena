import React, { useRef } from 'react'
import { connect } from 'react-redux'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import useI18n from '@webapp/commonComponents/hooks/useI18n'
import { createProcessingStepCalculation, putProcessingStepCalculationIndex } from '../actions'
import ProcessingStepCalculationsListItem from './processingStepCalculationsListItem'

import useProcessingStepCalculationsListState from './useProcessingStepCalculationsListState'

const ProcessingStepCalculationsList = props => {
  const {
    processingStep,
    calculationEditorOpened,
    createProcessingStepCalculation,
    putProcessingStepCalculationIndex,
  } = props

  const placeholderRef = useRef(null)
  const { dragging, onDragStart, onDragEnd, onDragOver } = useProcessingStepCalculationsListState(
    placeholderRef,
    putProcessingStepCalculationIndex,
  )

  const calculationSteps = ProcessingStep.getCalculationSteps(processingStep)
  const i18n = useI18n()

  return (
    <div className="form-item">
      {!calculationEditorOpened && (
        <div className="form-label processing-step__calculations-label">
          {i18n.t('processingStepView.calculationSteps')}
          <button className="btn-s btn-transparent" onClick={() => createProcessingStepCalculation()}>
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      <div className="processing-step__calculations">
        {calculationSteps.map(calculation => (
          <ProcessingStepCalculationsListItem
            key={ProcessingStepCalculation.getUuid(calculation)}
            calculation={calculation}
            dragging={dragging}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
          />
        ))}

        <div className="processing-step__calculation placeholder" ref={placeholderRef}>
          <div className="processing-step__calculation-index" />
          <div className="processing-step__calculation-content" />
        </div>
      </div>
    </div>
  )
}

ProcessingStepCalculationsList.defaultProps = {
  processingStep: null,
}

export default connect(null, {
  createProcessingStepCalculation,
  putProcessingStepCalculationIndex,
})(ProcessingStepCalculationsList)
