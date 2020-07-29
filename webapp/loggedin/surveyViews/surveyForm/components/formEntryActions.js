import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router'

import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'

import * as RecordState from '@webapp/loggedin/surveyViews/record/recordState'

import { useI18n } from '@webapp/store/system'
import ErrorBadge from '@webapp/components/errorBadge'

import { RecordActions } from '@webapp/store/ui/record'
import { DialogConfirmActions } from '@webapp/store/ui'

const RecordEntryButtons = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()
  const record = useSelector(RecordState.getRecord)

  const stepId = Record.getStep(record)
  const step = RecordStep.getStep(stepId)
  const stepNext = RecordStep.getNextStep(stepId)
  const stepPrev = RecordStep.getPreviousStep(stepId)
  const valid = Validation.isObjValid(record)

  const getStepLabel = (step) => i18n.t(`surveyForm.step.${RecordStep.getName(step)}`)

  return (
    <React.Fragment>
      <ErrorBadge validation={{ valid }} labelKey="dataView.invalidRecord" />

      <div className="survey-form-header__record-actions-steps">
        {stepPrev && (
          <button
            className="btn-s btn-transparent"
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'surveyForm.formEntryActions.confirmDemote',
                  params: { name: getStepLabel(stepPrev) },
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepPrev), history)),
                })
              )
            }
          >
            <span className="icon icon-reply icon-12px" />
          </button>
        )}

        <span>
          {i18n.t('surveyForm.formEntryActions.step', {
            id: RecordStep.getId(step),
            name: getStepLabel(step),
          })}
        </span>

        {stepNext && (
          <button
            className="btn-s btn-transparent"
            aria-disabled={!valid}
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'surveyForm.formEntryActions.confirmPromote',
                  params: { name: getStepLabel(stepNext) },
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepNext), history)),
                })
              )
            }
          >
            <span className="icon icon-redo2 icon-12px" />
          </button>
        )}
      </div>

      <button
        className="btn-s btn-danger"
        onClick={() =>
          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key: 'surveyForm.formEntryActions.confirmDelete',
              onOk: () => dispatch(RecordActions.deleteRecord(history)),
            })
          )
        }
        aria-disabled={false}
      >
        <span className="icon icon-bin icon-12px icon-left" />
        {i18n.t('common.delete')}
      </button>
    </React.Fragment>
  )
}

const FormEntryActions = (props) => {
  const { preview, entry } = props

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div className="survey-form-header__actions">
      {preview ? (
        <button className="btn-s btn-transparent" onClick={() => dispatch(RecordActions.deleteRecordUuidPreview())}>
          <span className="icon icon-eye-blocked icon-12px icon-left" />
          {i18n.t('surveyForm.formEntryActions.closePreview')}
        </button>
      ) : (
        entry && <RecordEntryButtons />
      )}
    </div>
  )
}

FormEntryActions.defaultProps = {
  preview: false,
  entry: false,
}

export default FormEntryActions
