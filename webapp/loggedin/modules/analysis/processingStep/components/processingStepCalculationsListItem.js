import './processingStepCalculationsListItem.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { setProcessingStepCalculationForEdit } from '../actions'

const ProcessingStepCalculationsListItem = props => {
  const {
    calculation,
    calculationForEdit,
    isCalculationEditDirty,
    isCalculationEditTemporary,
    nodeDef,
    lang,
    dragging,
    onDragStart,
    onDragEnd,
    onDragOver,
    setProcessingStepCalculationForEdit,
  } = props

  const i18n = useI18n()

  const editing = ProcessingStepCalculation.isEqual(calculationForEdit)(calculation)

  let className = 'processing-step__calculation'
  className += editing ? ' editing' : ''
  className += dragging ? ' dragging' : ''

  const index = ProcessingStepCalculation.getIndex(calculation)

  const [showCalculationEditCancelConfirm, setCalculationEditShowCancelConfirm] = useState()
  return (
    <div
      className={className}
      draggable={!isCalculationEditTemporary}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      data-index={index}
    >
      <div className="processing-step__calculation-index">{index + 1}</div>

      <div
        className="processing-step__calculation-content"
        onClick={() =>
          !editing &&
          (isCalculationEditDirty
            ? setCalculationEditShowCancelConfirm(true)
            : setProcessingStepCalculationForEdit(calculation))
        }
      >
        <div>
          {ProcessingStepCalculation.getLabel(i18n.lang)(calculation)} ({nodeDef && NodeDef.getLabel(nodeDef, lang)})
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>

      {showCalculationEditCancelConfirm && (
        <ConfirmDialog
          message={i18n.t('processingStepCalculationView.confirmCancel')}
          onOk={() => {
            setCalculationEditShowCancelConfirm(false)
            setProcessingStepCalculationForEdit(calculation)
          }}
          onCancel={() => setCalculationEditShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}

ProcessingStepCalculationsListItem.defaultProps = {
  calculation: null,
}

const mapStateToProps = (state, { calculation }) => {
  const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
  const survey = SurveyState.getSurvey(state)
  const isCalculationEditDirty = ProcessingStepCalculationState.isDirty(state)
  const isCalculationEditTemporary = R.pipe(
    ProcessingStepCalculationState.getCalculationTemp,
    R.defaultTo({}),
    ProcessingStepCalculation.isTemporary,
  )(state)

  return {
    lang: AppState.getLang(state),
    nodeDef: Survey.getNodeDefByUuid(nodeDefUuid)(survey),
    calculationForEdit: ProcessingStepState.getProcessingStepCalculationForEdit(state),
    isCalculationEditDirty,
    isCalculationEditTemporary,
  }
}

export default connect(mapStateToProps, {
  setProcessingStepCalculationForEdit,
})(ProcessingStepCalculationsListItem)
