import './processingStepCalculationsListItem.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { setProcessingStepCalculationForEdit } from '../actions'

const ProcessingStepCalculationsListItem = props => {

  const {
    calculation, calculationForEdit, nodeDef, lang,
    calculationEditorOpened,
    setProcessingStepCalculationForEdit,
  } = props

  const className = `processing-step__calculation${ProcessingStepCalculation.isEqual(calculationForEdit)(calculation) ? ' editing' : ''}`
  return (
    <div className={className}>

      <div className="processing-step__calculation-index">
        {ProcessingStepCalculation.getIndex(calculation) + 1}
      </div>

      <div className="processing-step__calculation-content"
           onClick={() => setProcessingStepCalculationForEdit(calculation)}>
        <div>
          {ProcessingStepCalculation.getUuid(calculation)}
          {nodeDef && NodeDef.getLabel(nodeDef, lang)}
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit"/>
      </div>

    </div>
  )

}

ProcessingStepCalculationsListItem.defaultProps = {
  calculation: null
}

const mapStateToProps = (state, { calculation }) => {
  const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
  const survey = SurveyState.getSurvey(state)
  return {
    lang: AppState.getLang(state),
    nodeDef: Survey.getNodeDefByUuid(nodeDefUuid)(survey),
    calculationForEdit: ProcessingStepState.getProcessingStepCalculationForEdit(state),
  }
}

export default connect(
  mapStateToProps,
  { setProcessingStepCalculationForEdit }
)(ProcessingStepCalculationsListItem)