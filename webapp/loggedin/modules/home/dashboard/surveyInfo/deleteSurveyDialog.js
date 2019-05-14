import './deleteSurveyDialog.scss'

import React, { useState, useEffect, useContext } from 'react'
import Markdown from 'react-remarkable'

import AppContext from '../../../../../app/appContext'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../../../commonComponents/modal'

const DeleteSurveyDialog = ({ surveyName, onDelete, onCancel }) => {
  const { i18n } = useContext(AppContext)

  const [ confirmName, setConfirmName ] = useState('')

  const confirmNameRef = React.createRef()

  useEffect(() => {
    setConfirmName('')
    confirmNameRef.current.focus()
  }, [])

  return (
    <Modal isOpen={true} onClose={() => onCancel()}>
      <ModalHeader>
        <h5 className="survey-delete-dialog__header">{i18n.t('homeView.deleteSurveyDialog.areYouSure')}</h5>
      </ModalHeader>

      <ModalBody>
        <div className="survey-delete-dialog__body">
          <div className="highlight">
            <div>
              <Markdown>
                {i18n.t('homeView.deleteSurveyDialog.deleteWarining', { surveyName })}
              </Markdown>
            </div>
            <div>{i18n.t('common.cantUndoWarning')}</div>
          </div>

          <div className="text-center">
            {i18n.t('homeView.deleteSurveyDialog.confirmName')}
          </div>

          <input type="text"
                 className="confirm-name"
                 value={confirmName}
                 onChange={evt => setConfirmName(evt.target.value)}
                 ref={confirmNameRef}/>
        </div>
      </ModalBody>

      <ModalFooter>
        <div>
          <button className="btn btn-of modal-footer__item"
                  onClick={onCancel}
                  aria-disabled={false}>
            <span className="icon icon-cross icon-12px icon-left"/>
            {i18n.t('common.cancel')}
          </button>

          <button className="btn btn-of btn-danger modal-footer__item"
                  onClick={onDelete}
                  aria-disabled={!(surveyName === confirmName)}>
            <span className="icon icon-bin icon-12px icon-left"/>
            {i18n.t('common.delete')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteSurveyDialog