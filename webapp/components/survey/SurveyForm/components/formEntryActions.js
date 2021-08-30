import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'

import ErrorBadge from '@webapp/components/errorBadge'

import { useAuthCanDeleteRecord, useAuthCanDemoteRecord, useAuthCanPromoteRecord } from '@webapp/store/user/hooks'
import { RecordActions, useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'

import { DataTestId } from '@webapp/utils/dataTestId'
import { Button } from '@webapp/components/buttons'

const RecordEntryButtons = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()
  const record = useRecord()

  const stepId = Record.getStep(record)
  const step = RecordStep.getStep(stepId)
  const stepNext = RecordStep.getNextStep(stepId)
  const stepPrev = RecordStep.getPreviousStep(stepId)
  const valid = Validation.isObjValid(record)

  const canPromote = useAuthCanPromoteRecord(record)
  const canDemote = useAuthCanDemoteRecord(record)
  const canDelete = useAuthCanDeleteRecord(record)

  const getStepLabel = (_step) => i18n.t(`surveyForm.step.${RecordStep.getName(_step)}`)

  return (
    <>
      <ErrorBadge id={DataTestId.record.errorBadge} validation={{ valid }} labelKey="dataView.invalidRecord" />

      <div className="survey-form-header__record-actions-steps">
        {canDemote && (
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
            type="button"
            title={i18n.t('surveyForm.formEntryActions.demoteTo', { stepPrev: getStepLabel(stepPrev) })}
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

        {canPromote && (
          <Button
            className="btn-s btn-transparent"
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: `surveyForm.formEntryActions.confirmPromote${valid ? '' : 'WithErrors'}`,
                  params: { name: getStepLabel(stepNext) },
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepNext), history)),
                })
              )
            }
            title={i18n.t('surveyForm.formEntryActions.promoteTo', { stepNext: getStepLabel(stepNext) })}
            iconClassName="icon-redo2 icon-12px"
          />
        )}
      </div>

      {canDelete && (
        <button
          className="btn-s btn-danger"
          data-testid={DataTestId.record.deleteBtn}
          onClick={() =>
            dispatch(
              DialogConfirmActions.showDialogConfirm({
                key: 'surveyForm.formEntryActions.confirmDelete',
                onOk: () => dispatch(RecordActions.deleteRecord(history)),
              })
            )
          }
          aria-disabled={false}
          type="button"
        >
          <span className="icon icon-bin icon-12px icon-left" />
          {i18n.t('common.delete')}
        </button>
      )}
    </>
  )
}

const FormEntryActions = (props) => {
  const { preview, entry } = props

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div className="survey-form-header__actions">
      {preview ? (
        <button
          className="btn-s btn-transparent"
          data-testid={DataTestId.surveyForm.previewCloseBtn}
          onClick={() => dispatch(RecordActions.deleteRecordUuidPreview())}
          type="button"
        >
          <span className="icon icon-eye-blocked icon-12px icon-left" />
          {i18n.t('surveyForm.formEntryActions.closePreview')}
        </button>
      ) : (
        entry && <RecordEntryButtons />
      )}
    </div>
  )
}

FormEntryActions.propTypes = {
  preview: PropTypes.bool,
  entry: PropTypes.bool,
}

FormEntryActions.defaultProps = {
  preview: false,
  entry: false,
}

export default FormEntryActions
