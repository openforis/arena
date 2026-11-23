import { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { FormItem } from '@webapp/components/form/Input'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type NodeDefEntitySelectorDialogProps = {
  confirmButtonLabel: string
  currentNodeDef: ArenaAnyNodeDef
  entitySelectLabel: string
  filterFn?: (...args: any[]) => any
  isEntitySelectable?: (...args: any[]) => any
  onChange?: (...args: any[]) => any
  onClose: (...args: any[]) => any
  onConfirm: (...args: any[]) => any
  title: string
}

export const NodeDefEntitySelectorDialog = (props: NodeDefEntitySelectorDialogProps) => {
  const {
    confirmButtonLabel,
    entitySelectLabel,
    filterFn = undefined,
    currentNodeDef,
    isEntitySelectable = undefined,
    onChange: onChangeProp = undefined,
    onClose,
    onConfirm: onConfirmProp,
    title,
  } = props

  const survey = useSurvey()
  const parentNodeDef = Survey.getNodeDefParent(currentNodeDef)(survey)

  const [selectedEntityDefUuid, setSelectedEntityDefUuid] = useState(null)

  const onChange = useCallback(
    (entityDefUuid) => {
      setSelectedEntityDefUuid(entityDefUuid)
      onChangeProp?.(entityDefUuid)
    },
    [onChangeProp]
  )

  const onConfirm = useCallback(() => {
    onConfirmProp(selectedEntityDefUuid)
  }, [onConfirmProp, selectedEntityDefUuid])

  const confirmButtonDisabled =
    !selectedEntityDefUuid || (isEntitySelectable && !isEntitySelectable?.(selectedEntityDefUuid))

  return (
    <Modal
      className="survey-form__node-def-entity-selector-dialog"
      onClose={onClose}
      showCloseButton
      title={title}
      titleParams={{ nodeDefName: NodeDef.getName(currentNodeDef), parentNodeDefName: NodeDef.getName(parentNodeDef) }}
    >
      <ModalBody>
        <FormItem label={entitySelectLabel}>
          <EntitySelector
            filterFn={filterFn}
            hierarchy={Survey.getHierarchy()(survey)}
            nodeDefLabelType={NodeDef.NodeDefLabelTypes.labelAndName}
            nodeDefUuidEntity={selectedEntityDefUuid}
            onChange={onChange}
            showSingleEntities
          />
        </FormItem>
      </ModalBody>

      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button
          className="modal-footer__item"
          disabled={confirmButtonDisabled}
          onClick={onConfirm}
          label={confirmButtonLabel}
        />
      </ModalFooter>
    </Modal>
  )
}
