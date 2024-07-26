import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { Button, ButtonCancel } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'

export const NodeDefConversionDialog = (props) => {
  const { nodeDef, onClose } = props

  const i18n = useI18n()

  const [selectedToType, setSelectedToType] = useState(null)

  const onConfirm = useCallback(() => {}, [])

  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)

  const availableToTypes = Object.values(NodeDef.nodeDefType).filter((type) => type != NodeDef.getType(nodeDef))
  const confirmButtonDisabled = !selectedToType

  return (
    <Modal
      className="survey-form__node-def-conversion-dialog"
      onClose={onClose}
      showCloseButton
      title="nodeDefEdit.conversion.dialogTitle"
      titleParams={{ nodeDefName }}
    >
      <ModalBody>
        <FormItem label={i18n.t('nodeDefEdit.conversion.fromType')}>{i18n.t(`nodeDefsTypes.${nodeDefType}`)}</FormItem>
        <FormItem label={i18n.t('nodeDefEdit.conversion.toType')}>
          <Dropdown
            className="to-type-dropdown"
            items={availableToTypes}
            itemKey={A.identity}
            itemLabel={(type) => i18n.t(`nodeDefsTypes.${type}`)}
            onChange={setSelectedToType}
            selection={selectedToType}
          />
        </FormItem>
      </ModalBody>

      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button
          className="modal-footer__item"
          disabled={confirmButtonDisabled}
          label="nodeDefEdit.conversion.confirmButtonLabel"
          onClick={onConfirm}
        />
      </ModalFooter>
    </Modal>
  )
}

NodeDefConversionDialog.propTypes = {
  nodeDef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
}
