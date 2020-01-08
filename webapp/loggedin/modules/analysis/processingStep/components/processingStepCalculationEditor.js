import './processingStepCalculationEditor.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { setProcessingStepCalculationForEdit } from '../actions'
import { updateProcessingStepCalculationProp } from '../../processingStepCalculation/actions'
import * as SurveyState from '@webapp/survey/surveyState'

const ProcessingStepCalculationEditor = props => {
  const { surveyInfo, calculation, setProcessingStepCalculationForEdit, updateProcessingStepCalculationProp } = props

  return (
    <div className="processing-step__calculation-editor">
      <button className="btn btn-close" onClick={() => setProcessingStepCalculationForEdit(null)}>
        <span className="icon icon-cross icon-10px" />
      </button>

      <LabelsEditor
        languages={Survey.getLanguages(surveyInfo)}
        labels={ProcessingStepCalculation.getLabels(calculation)}
        onChange={labels => updateProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.labels, labels)}
      />
    </div>
  )
}

ProcessingStepCalculationEditor.defaultProps = {
  surveyInfo: null,
  calculation: null,
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  calculation: ProcessingStepCalculationState.getCalculation(state),
})

export default connect(mapStateToProps, {
  setProcessingStepCalculationForEdit,
  updateProcessingStepCalculationProp,
})(ProcessingStepCalculationEditor)
