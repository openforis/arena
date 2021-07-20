import './DeleteSurveyDialog.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import Markdown from '@webapp/components/markdown'
import { Modal, ModalBody, ModalHeader, ModalFooter } from '@webapp/components/modal'
import { DataTestId } from '@webapp/utils/dataTestId'

const DeleteSurveyDialog = ({ surveyName, onDelete, onCancel }) => {
  const i18n = useI18n()
  const [confirmName, setConfirmName] = useState('')

  return (
    <Modal isOpen onClose={() => onCancel()}>
      <ModalHeader>
        <h5 className="survey-delete-dialog__header">{i18n.t('homeView.deleteSurveyDialog.confirmDelete')}</h5>
      </ModalHeader>

      <ModalBody>
        <div className="survey-delete-dialog__body">
          <div className="highlight">
            <Markdown
              source={i18n.t('homeView.deleteSurveyDialog.deleteWarning', {
                surveyName,
              })}
            />
            <div>{i18n.t('common.cantUndoWarning')}</div>
          </div>

          <div className="text-center">{i18n.t('homeView.deleteSurveyDialog.confirmName')}</div>

          <input
            type="text"
            className="confirm-name"
            value={confirmName}
            data-testid={DataTestId.surveyDelete.confirmNameInput}
            onChange={(event) => setConfirmName(event.target.value)}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <div>
          <button type="button" className="btn modal-footer__item" onClick={onCancel} aria-disabled={false}>
            <span className="icon icon-cross icon-12px icon-left" />
            {i18n.t('common.cancel')}
          </button>

          <button
            type="button"
            className="btn btn-danger modal-footer__item"
            onClick={onDelete}
            aria-disabled={surveyName !== confirmName}
          >
            <span className="icon icon-bin icon-12px icon-left" />
            {i18n.t('common.delete')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

DeleteSurveyDialog.propTypes = {
  surveyName: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default DeleteSurveyDialog
