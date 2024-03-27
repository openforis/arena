import './nodeDefMultipleEditDialog.scss'

import React from 'react'

import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'

import * as NodeDefUiProps from '../nodeDefUIProps'

const NodeDefMultipleEditDialog = (props) => {
  const { nodeDef, label, onClose } = props

  const i18n = useI18n()

  return (
    <Modal className="survey-form__node-def-multiple-edit-dialog" onClose={onClose} title={label}>
      <ModalBody>{React.createElement(NodeDefUiProps.getComponent(nodeDef), props)}</ModalBody>

      <ModalFooter>
        <div>
          <button className="btn modal-footer__item" onClick={onClose}>
            {i18n.t('common.close')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default NodeDefMultipleEditDialog
