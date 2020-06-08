import './appDialogConfirm.scss'

import React from 'react'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions, useDialogConfirm } from '@webapp/store/ui'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/components/hooks'
import Markdown from '@webapp/components/markdown'

const AppDialogConfirm = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const { key, params } = useDialogConfirm()

  return key ? (
    <Modal className="app-dialog-confirm">
      <ModalBody>
        <Markdown source={i18n.t(key, params)} />
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          className="btn btn-cancel modal-footer__item"
          onClick={() => dispatch(DialogConfirmActions.onDialogConfirmCancel())}
        >
          {i18n.t('common.cancel')}
        </button>

        <button
          type="button"
          className="btn btn-primary modal-footer__item"
          onClick={() => dispatch(DialogConfirmActions.onDialogConfirmOk())}
        >
          {i18n.t('common.ok')}
        </button>
      </ModalFooter>
    </Modal>
  ) : null
}

export default AppDialogConfirm
