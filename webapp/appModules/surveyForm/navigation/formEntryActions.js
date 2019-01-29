import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'
import Record from '../../../../common/record/record'

import { deleteRecord, updateRecordStep } from '../record/actions'
import { appModuleUri } from '../../appModules'
import { designerModules } from '../../designer/designerModules'

import * as SurveyState from '../../../survey/surveyState'
import * as RecordState from '../../surveyForm/record/recordState'
import * as SurveyFormState from '../../surveyForm/surveyFormState'

const RecordEntryButtons = ({
  deleteRecord,
  updateRecordStep,
  recordStep,
  nextStep,
  previousStep,
  recordStepName,
  history
}) => (
  <React.Fragment>
    {
      previousStep &&
      <button className="btn-s btn-of"
              style={{ marginRight: 5 }}
              onClick={() =>
                window.confirm('Are sure you want to demote this record?')
                  ? updateRecordStep(previousStep.id, history)
                  : null}>
        <span className="icon icon-reply icon-12px"/>
      </button>
    }

    Step {recordStep} ({recordStepName})

    {
      nextStep &&
      <button className="btn-s btn-of"
        style={{ marginLeft: 5 }}
        onClick={() =>
          window.confirm('Are sure you want to demote this record? You won\'t be able to edit it anymore')
          ? updateRecordStep(nextStep.id, history)
          : null}>
        <span className="icon icon-redo2 icon-12px" />
      </button>
    }

    <button className="btn-s btn-of btn-danger"
            onClick={() =>
              window.confirm('Are you sure you want to delete this record? This operation cannot be undone')
                ? deleteRecord()
                : null
            }
            aria-disabled={false}>
      <span className="icon icon-bin icon-12px icon-left"/>
      Delete
    </button>
  </React.Fragment>
)

const FormEntryActions = ({
  entry,
  preview,
  deleteRecord,
  recordStep,
  nextStep,
  previousStep,
  recordStepName, 
  updateRecordStep,
  history
}) =>
  entry &&
  <div className="survey-form__nav-record-actions">
    {
      preview
        ? (
          <Link to={appModuleUri(designerModules.formDesigner)} className="btn btn-of">
            <span className="icon icon-eye-blocked icon-12px icon-left"/>
            Close preview
          </Link>
        ) :
        (
          <RecordEntryButtons history={history}
                              deleteRecord={deleteRecord}
                              updateRecordStep={updateRecordStep}
                              recordStep={recordStep}
                              nextStep={nextStep}
                              previousStep={previousStep}
                              recordStepName={recordStepName}/>
        )
    }
  </div>

const mapStateToProps = (state) => {
  const surveyInfo = Survey.getSurveyInfo(SurveyState.getSurvey(state))
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)

  const recordStep = Record.getStep(record)

  return {
    recordStep: recordStep,
    recordStepName: Survey.getStepName(recordStep)(surveyInfo),
    nextStep: Survey.getNextStep(recordStep)(surveyInfo),
    previousStep: Survey.getPreviousStep(recordStep)(surveyInfo)
  }
}

export default connect(mapStateToProps, { deleteRecord, updateRecordStep })(FormEntryActions)