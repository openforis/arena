import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'

import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'

import { useAuthCanDemoteRecord, useAuthCanEditRecord, useAuthCanPromoteRecord } from '@webapp/store/user/hooks'
import { RecordActions, RecordState, useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'

import { TestId } from '@webapp/utils/testId'
import { Button } from '@webapp/components/buttons'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { useIsRecordViewWithoutHeader } from '@webapp/store/ui/record/hooks'

const RecordEntryButtons = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const record = useRecord()
  const noHeader = useIsRecordViewWithoutHeader()

  const recordEditLocked = useSelector(RecordState.isRecordEditLocked)
  const stepId = Record.getStep(record)
  const step = RecordStep.getStep(stepId)
  const stepNext = RecordStep.getNextStep(stepId)
  const stepPrev = RecordStep.getPreviousStep(stepId)
  const valid = Validation.isObjValid(record)

  const canPromote = useAuthCanPromoteRecord(record) && !noHeader
  const canDemote = useAuthCanDemoteRecord(record) && !noHeader
  const canEdit = useAuthCanEditRecord(record)

  const getStepLabel = (_step) => i18n.t(`surveyForm.step.${RecordStep.getName(_step)}`)

  return (
    <>
      {canEdit && (
        <Button
          iconClassName={recordEditLocked ? 'icon-lock' : 'icon-unlocked'}
          label={`recordView.${recordEditLocked ? 'unlock' : 'lock'}`}
          onClick={() => dispatch(RecordActions.toggleEditLock)}
          testId={TestId.record.editLockToggleBtn}
          variant="text"
        />
      )}
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
            iconClassName="icon-reply icon-12px"
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'surveyForm.formEntryActions.confirmDemote',
                  params: { name: getStepLabel(stepPrev) },
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepPrev), navigate)),
                })
              )
            }
            size="small"
            title="surveyForm.formEntryActions.demoteTo"
            titleParams={{ stepPrev: getStepLabel(stepPrev) }}
            variant="text"
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
            iconClassName="icon-redo2 icon-12px"
            onClick={() =>
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: `surveyForm.formEntryActions.confirmPromote${valid ? '' : 'WithErrors'}`,
                  params: { name: getStepLabel(stepNext) },
                  onOk: () => dispatch(RecordActions.updateRecordStep(RecordStep.getId(stepNext), navigate)),
                })
              )
            }
            size="small"
            title="surveyForm.formEntryActions.promoteTo"
            titleParams={{ stepNext: getStepLabel(stepNext) }}
            variant="text"
          />
        )}
      </div>
    </>
  )
}

const FormEntryActions = (props) => {
  const { preview = false, entry = false } = props

  const dispatch = useDispatch()

  return (
    <div className="survey-form-header__actions">
      {preview ? (
        <Button
          iconClassName="icon-eye-blocked icon-12px"
          label="surveyForm.formEntryActions.closePreview"
          onClick={() => dispatch(RecordActions.deleteRecordUuidPreview())}
          size="small"
          testId={TestId.surveyForm.previewCloseBtn}
          variant="text"
        />
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

export default FormEntryActions
