import './processingStepCalculationEditor.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { setProcessingStepCalculationForEdit } from '../actions'

const ProcessingStepCalculationEditor = props => {
  const { calculation, setProcessingStepCalculationForEdit } = props

  return (
    <div className="processing-step__calculation-editor">
      <button className="btn btn-close" onClick={() => setProcessingStepCalculationForEdit(null)}>
        <span className="icon icon-cross icon-10px" />
      </button>
    </div>
  )
}

ProcessingStepCalculationEditor.defaultProps = {
  calculation: null,
}

const mapStateToProps = state => ({
  calculation: ProcessingStepState.getProcessingStepCalculationForEdit(state),
})

export default connect(mapStateToProps, {
  setProcessingStepCalculationForEdit,
})(ProcessingStepCalculationEditor)
