import { useState } from 'react'
import PropTypes from 'prop-types'

import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { useI18n } from '@webapp/store/system'

export const LockFixedPropertiesDialog = (props) => {
  const { messageKey, onClose, onConfirm, titleKey } = props

  const i18n = useI18n()
  const [locked, setLocked] = useState(true)

  return (
    <Modal className="lock-fixed-properties-dialog" onClose={onClose} title={titleKey}>
      <ModalBody>
        <p>{i18n.t(messageKey)}</p>
        <Checkbox checked={locked} label="categoryEdit.lockFixedProperties" onChange={setLocked} />
      </ModalBody>
      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button className="modal-footer__item" label="common.confirm" onClick={() => onConfirm({ locked })} />
      </ModalFooter>
    </Modal>
  )
}

LockFixedPropertiesDialog.propTypes = {
  messageKey: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  titleKey: PropTypes.string.isRequired,
}
