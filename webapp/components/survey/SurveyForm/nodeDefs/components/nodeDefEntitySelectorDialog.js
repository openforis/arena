import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { FormItem } from '@webapp/components/form/Input'

export const NodeDefEntitySelectorDialog = (props) => {
  const {
    confirmButtonLabel,
    entitySelectLabel,
    currentNodeDef,
    isEntitySelectable,
    onChange: onChangeProp,
    onClose,
    onConfirm: onConfirmProp,
    title,
  } = props

  const survey = useSurvey()

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
      titleParams={{ nodeDefName: NodeDef.getName(currentNodeDef) }}
    >
      <ModalBody>
        <FormItem label={entitySelectLabel}>
          <EntitySelector
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

NodeDefEntitySelectorDialog.propTypes = {
  confirmButtonLabel: PropTypes.string.isRequired,
  currentNodeDef: PropTypes.object.isRequired,
  entitySelectLabel: PropTypes.string.isRequired,
  isEntitySelectable: PropTypes.func,
  onChange: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
}
