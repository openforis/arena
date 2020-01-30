import './processingStepCalculationsListItem.scss'

import React from 'react'
import { connect, useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { setProcessingStepCalculationForEdit } from '../actions'

const ProcessingStepCalculationsListItem = props => {
  const {
    calculation,
    calculationForEdit,
    nodeDef,
    validation,
    editingCalculation,
    calculationEditDirty,
    lang,
    dragging,
    onDragStart,
    onDragEnd,
    onDragOver,
  } = props

  const i18n = useI18n()
  const dispatch = useDispatch()

  const editing = ProcessingStepCalculation.isEqual(calculationForEdit)(calculation)

  let className = 'processing-step__calculation'
  className += editing ? ' editing' : ''
  className += dragging ? ' dragging' : ''

  const index = ProcessingStepCalculation.getIndex(calculation)

  return (
    <div
      className={className}
      draggable={!editingCalculation}
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
          (calculationEditDirty
            ? dispatch(showDialogConfirm('common.cancelConfirm', {}, setProcessingStepCalculationForEdit(calculation)))
            : dispatch(setProcessingStepCalculationForEdit(calculation)))
        }
      >
        <div className="processing-step__calculation-label">
          {ProcessingStepCalculation.getLabel(i18n.lang)(calculation)} ({nodeDef && NodeDef.getLabel(nodeDef, lang)})
          <ErrorBadge validation={validation} showLabel={false} className="error-badge-inverse" />
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </div>
  )
}

ProcessingStepCalculationsListItem.defaultProps = {
  calculation: null,
}

const mapStateToProps = (state, { calculation }) => {
  const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
  const survey = SurveyState.getSurvey(state)
  const chain = ProcessingChainState.getProcessingChain(state)
  const validation = ProcessingChain.getItemValidationByUuid(ProcessingStepCalculation.getUuid(calculation))(chain)
  const calculationEditDirty = ProcessingStepCalculationState.isDirty(state)
  const editingCalculation = ProcessingStepCalculationState.isEditingCalculation(state)

  return {
    lang: AppState.getLang(state),
    nodeDef: Survey.getNodeDefByUuid(nodeDefUuid)(survey),
    validation,
    calculationForEdit: ProcessingStepCalculationState.getCalculation(state),
    calculationEditDirty,
    editingCalculation,
  }
}

export default connect(mapStateToProps)(ProcessingStepCalculationsListItem)
