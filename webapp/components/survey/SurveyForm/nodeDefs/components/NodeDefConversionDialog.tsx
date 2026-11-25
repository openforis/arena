import './NodeDefConversionDialog.scss'

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/Modal'
import { useAppDispatch } from '@webapp/store'
import { NodeDefsActions } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

type NodeDefConversionDialogProps = {
  nodeDef: ArenaAnyNodeDef
  onClose: (...args: any[]) => any
}

export const NodeDefConversionDialog = (props: NodeDefConversionDialogProps) => {
  const { nodeDef, onClose } = props

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()

  const [selectedToType, setSelectedToType] = useState(null)

  const onConfirm = useCallback(() => {
    dispatch(NodeDefsActions.convertNodeDef({ nodeDef, toType: selectedToType, navigate }))
  }, [dispatch, navigate, nodeDef, selectedToType])

  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)

  const availableToTypes = NodeDef.getConvertibleTypes(nodeDef)
  const confirmButtonDisabled = !selectedToType

  return (
    <Modal
      className="survey-form__node-def-conversion-dialog"
      onClose={onClose}
      showCloseButton
      title="nodeDefEdit:conversion.dialogTitle"
      titleParams={{ nodeDefName }}
    >
      <ModalBody>
        <FormItem label="nodeDefEdit:conversion.fromType">{i18n.t(`nodeDefsTypes.${nodeDefType}`)}</FormItem>
        <FormItem label="nodeDefEdit:conversion.toType">
          <Dropdown
            className="to-type-dropdown"
            items={availableToTypes}
            itemValue={A.identity}
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
          label="common.convert"
          onClick={onConfirm}
        />
      </ModalFooter>
    </Modal>
  )
}
