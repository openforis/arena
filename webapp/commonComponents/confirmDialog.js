import './confirmDialog.scss'

import React from 'react'

import { Modal, ModalBody, ModalFooter } from '@webapp/commonComponents/modal'
import { useI18n } from '@webapp/commonComponents/hooks'
import Markdown from '@webapp/commonComponents/markdown'

const ConfirmDialog = props => {

  const { message, onOk, onCancel } = props
  const i18n = useI18n()

  return (
    <Modal className="confirm-dialog">

      <ModalBody>
        <Markdown source={message}/>
      </ModalBody>

      <ModalFooter>
        <button className="btn btn-cancel modal-footer__item"
                onClick={onCancel}>
          {i18n.t('common.cancel')}
        </button>

        <button className="btn btn-ok modal-footer__item"
                onClick={onOk}>
          {i18n.t('common.ok')}
        </button>
      </ModalFooter>

    </Modal>
  )
}

ConfirmDialog.defaultProps = {
  message: '',
  onOk: () => {},
  onCancel: () => {},
}

export default ConfirmDialog