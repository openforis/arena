import './appDialogConfirm.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Modal, ModalBody, ModalFooter } from '@webapp/commonComponents/modal'
import { useI18n } from '@webapp/commonComponents/hooks'
import Markdown from '@webapp/commonComponents/markdown'

import * as AppDialogConfirmState from './appDialogConfirmState'
import { onDialogConfirmOk, hideDialogConfirm } from './actions'

const AppDialogConfirm = () => {
  const messageKey = useSelector(AppDialogConfirmState.getMessageKey)
  const messageParams = useSelector(AppDialogConfirmState.getMessageParams)

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <Modal className="app-dialog-confirm">
      <ModalBody>
        <Markdown source={i18n.t(messageKey, messageParams)} />
      </ModalBody>

      <ModalFooter>
        <button className="btn btn-cancel modal-footer__item" onClick={dispatch(hideDialogConfirm)}>
          {i18n.t('common.cancel')}
        </button>

        <button className="btn btn-primary modal-footer__item" onClick={dispatch(onDialogConfirmOk)}>
          {i18n.t('common.ok')}
        </button>
      </ModalFooter>
    </Modal>
  )
}

AppDialogConfirm.defaultProps = {
  messageKey: '',
  messageParams: {},
  onOk: () => {},
  onCancel: () => {},
}

export default AppDialogConfirm
