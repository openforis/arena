import './deleteSurveyDialog.scss'

import React, {useState} from 'react'

import {useI18n} from '@webapp/commonComponents/hooks'
import Markdown from '@webapp/commonComponents/markdown'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '@webapp/commonComponents/modal'

const DeleteSurveyDialog = ({surveyName, onDelete, onCancel}) => {
  const i18n = useI18n()
  const [confirmName, setConfirmName] = useState('')

  return (
    <Modal isOpen={true} onClose={() => onCancel()}>
      <ModalHeader>
        <h5 className="survey-delete-dialog__header">
          {i18n.t('homeView.deleteSurveyDialog.confirmDelete')}
        </h5>
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

          <div className="text-center">
            {i18n.t('homeView.deleteSurveyDialog.confirmName')}
          </div>

          <input
            type="text"
            className="confirm-name"
            value={confirmName}
            onChange={evt => setConfirmName(evt.target.value)}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <div>
          <button
            className="btn modal-footer__item"
            onClick={onCancel}
            aria-disabled={false}
          >
            <span className="icon icon-cross icon-12px icon-left" />
            {i18n.t('common.cancel')}
          </button>

          <button
            className="btn btn-danger modal-footer__item"
            onClick={onDelete}
            aria-disabled={!(surveyName === confirmName)}
          >
            <span className="icon icon-bin icon-12px icon-left" />
            {i18n.t('common.delete')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteSurveyDialog
