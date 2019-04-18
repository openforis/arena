import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import Record from '../../../../../common/record/record'
import RecordStep from '../../../../../common/record/recordStep'
import Validator from '../../../../../common/validation/validator'

import ErrorBadge from '../../../../commonComponents/errorBadge'

import { deleteRecord, updateRecordStep } from '../../record/actions'
import { appModuleUri } from '../../../appModules'
import { designerModules } from '../../../modules/designer/designerModules'

import * as RecordState from '../../record/recordState'
import * as SurveyFormState from '../surveyFormState'

const RecordEntryButtons = (props) => {

  const {
    history,
    step, stepNext, stepPrev,
    valid,
    deleteRecord, updateRecordStep,
  } = props

  return (
    <React.Fragment>

      <ErrorBadge validation={{ valid }} label="invalidRecord"/>

      <div className="survey-form__nav-record-actions-steps">
        {
          stepPrev &&
          <button className="btn-s btn-of"
                  onClick={() =>
                    confirm(`Are sure you want to demote this record to ${RecordStep.getName(stepPrev)}?`)
                      ? updateRecordStep(RecordStep.getId(stepPrev), history)
                      : null
                  }>
            <span className="icon icon-reply icon-12px"/>
          </button>
        }

        <span>Step {RecordStep.getId(step)} ({RecordStep.getName(step)})</span>

        {
          stepNext &&
          <button className="btn-s btn-of"
                  aria-disabled={!valid}
                  onClick={() =>
                    confirm(`Are sure you want to promote this record to ${RecordStep.getName(stepNext)}? You won't be able to edit it anymore`)
                      ? updateRecordStep(RecordStep.getId(stepNext), history)
                      : null
                  }>
            <span className="icon icon-redo2 icon-12px"/>
          </button>
        }
      </div>

      <button className="btn-s btn-of btn-danger"
              onClick={() =>
                window.confirm('Are you sure you want to delete this record? This operation cannot be undone')
                  ? deleteRecord(history)
                  : null
              }
              aria-disabled={false}>
        <span className="icon icon-bin icon-12px icon-left"/>
        Delete
      </button>
    </React.Fragment>
  )
}

const FormEntryActions = (props) => {

  const {
    history, preview,
    step, stepNext, stepPrev,
    valid,
    deleteRecord, updateRecordStep,
  } = props

  return (
    <div className="survey-form__nav-record-actions">
      {
        preview
          ? (
            <Link to={appModuleUri(designerModules.formDesigner)} className="btn btn-of">
              <span className="icon icon-eye-blocked icon-12px icon-left"/>
              Close preview
            </Link>
          )
          : (
            props.entry &&
            <RecordEntryButtons history={history}
                                deleteRecord={deleteRecord}
                                updateRecordStep={updateRecordStep}
                                step={step}
                                stepNext={stepNext}
                                stepPrev={stepPrev}
                                valid={valid}/>
          )
      }
    </div>
  )
}

const mapStateToProps = (state) => {
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)
  const stepId = Record.getStep(record)

  return {
    step: RecordStep.getStep(stepId),
    stepNext: RecordStep.getNextStep(stepId),
    stepPrev: RecordStep.getPreviousStep(stepId),
    valid: Validator.isValid(record)
  }
}

export default connect(mapStateToProps, { deleteRecord, updateRecordStep })(FormEntryActions)