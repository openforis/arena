import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'

import { useAuthCanDemoteRecord, useAuthCanPromoteRecord } from '@webapp/store/user/hooks'
import { RecordActions, useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'

import { TestId } from '@webapp/utils/testId'
import { Button } from '@webapp/components/buttons'
import { appModuleUri, dataModules } from '@webapp/app/appModules'

const RecordEntryButtons = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const record = useRecord()

  const stepId = Record.getStep(record)
  const step = RecordStep.getStep(stepId)
  const stepNext = RecordStep.getNextStep(stepId)
  const stepPrev = RecordStep.getPreviousStep(stepId)
  const valid = Validation.isObjValid(record)

  const canPromote = useAuthCanPromoteRecord(record)
  const canDemote = useAuthCanDemoteRecord(record)

  const getStepLabel = (_step) => i18n.t(`surveyForm.step.${RecordStep.getName(_step)}`)

  return (
    <>
      {!valid && (
        <Link
          data-testid={TestId.record.invalidBtn}
          className="btn btn-transparent error"
          to={`${appModuleUri(dataModules.recordValidationReport)}${Record.getUuid(record)}`}
          title={i18n.t('dataView.showValidationReport')}
        >
          <span className="icon icon-12px icon-warning icon-left" />
          {i18n.t('dataView.invalidRecord')}
        </Link>
      )}
      <div className="survey-form-header__record-actions-steps">
        {canDemote && (
          <Button
            className="btn-s btn-transparent"
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'surveyForm.formEntryActions.confirmDemote',
                  params: { name: getStepLabel(stepPrev) },
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepPrev), navigate)),
                })
              )
            }
            title="surveyForm.formEntryActions.demoteTo"
            titleParams={{ stepPrev: getStepLabel(stepPrev) }}
            iconClassName="icon-reply icon-12px"
          />
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
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepNext), navigate)),
                })
              )
            }
            title="surveyForm.formEntryActions.promoteTo"
            titleParams={{ stepNext: getStepLabel(stepNext) }}
            iconClassName="icon-redo2 icon-12px"
          />
        )}
      </div>
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
          data-testid={TestId.surveyForm.previewCloseBtn}
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
