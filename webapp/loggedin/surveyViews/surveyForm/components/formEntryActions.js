import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { useI18n } from '@webapp/commonComponents/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

import Record from '@core/record/record'
import RecordStep from '@core/record/recordStep'
import Validation from '@core/validation/validation'

import { deleteRecord, updateRecordStep } from '../../record/actions'
import { appModuleUri, designerModules } from '../../../appModules'

import * as RecordState from '../../record/recordState'

const RecordEntryButtons = (props) => {

  const {
    history,
    step, stepNext, stepPrev,
    valid,
    deleteRecord, updateRecordStep,
  } = props

  const i18n = useI18n()

  const getStepLabel = step => i18n.t(`surveyForm.step.${RecordStep.getName(step)}`)

  return (
    <React.Fragment>

      <ErrorBadge validation={{ valid }} labelKey="dataView.invalidRecord"/>

      <div className="survey-form-header__record-actions-steps">
        {
          stepPrev &&
          <button className="btn-s btn-transparent"
                  onClick={() =>
                    confirm(i18n.t('surveyForm.formEntryActions.confirmDemote', { name: getStepLabel(stepPrev) }))
                      ? updateRecordStep(RecordStep.getId(stepPrev), history)
                      : null
                  }>
            <span className="icon icon-reply icon-12px"/>
          </button>
        }

        <span>{i18n.t('surveyForm.formEntryActions.step', { id: RecordStep.getId(step), name: getStepLabel(step) })}</span>

        {
          stepNext &&
          <button className="btn-s btn-transparent"
                  aria-disabled={!valid}
                  onClick={() =>
                    confirm(i18n.t('surveyForm.formEntryActions.confirmPromote', { name: getStepLabel(stepNext) }))
                      ? updateRecordStep(RecordStep.getId(stepNext), history)
                      : null
                  }>
            <span className="icon icon-redo2 icon-12px"/>
          </button>
        }
      </div>

      <button className="btn-s btn-danger"
              onClick={() =>
                window.confirm(i18n.t('surveyForm.formEntryActions.confirmDelete'))
                  ? deleteRecord(history)
                  : null
              }
              aria-disabled={false}>
        <span className="icon icon-bin icon-12px icon-left"/>
        {i18n.t('common.delete')}
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

  const i18n = useI18n()

  return (
    <div className="survey-form-header__actions">
      {
        preview
          ? (
            <Link to={appModuleUri(designerModules.formDesigner)} className="btn-s btn-transparent">
              <span className="icon icon-eye-blocked icon-12px icon-left"/>
              {i18n.t('surveyForm.formEntryActions.closePreview')}
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
  const record = RecordState.getRecord(state)
  const stepId = Record.getStep(record)

  return {
    step: RecordStep.getStep(stepId),
    stepNext: RecordStep.getNextStep(stepId),
    stepPrev: RecordStep.getPreviousStep(stepId),
    valid: Validation.isObjValid(record),
  }
}

export default connect(mapStateToProps, { deleteRecord, updateRecordStep })(FormEntryActions)