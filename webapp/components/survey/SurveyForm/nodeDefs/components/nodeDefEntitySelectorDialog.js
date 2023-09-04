import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import { Button } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@webapp/components/modal'
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

  const i18n = useI18n()
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
    <Modal isOpen={true} className="survey-form__node-def-entity-selector-dialog" closeOnEsc={true} onClose={onClose}>
      <ModalHeader>{i18n.t(title, { nodeDefName: NodeDef.getName(currentNodeDef) })}</ModalHeader>

      <ModalBody>
        <FormItem label={i18n.t(entitySelectLabel)}>
          <EntitySelector
            hierarchy={Survey.getHierarchy()(survey)}
            nodeDefUuidEntity={selectedEntityDefUuid}
            onChange={onChange}
            showSingleEntities
          />
        </FormItem>
      </ModalBody>

      <ModalFooter>
        <Button
          className="btn modal-footer__item btn-primary"
          disabled={confirmButtonDisabled}
          onClick={onConfirm}
          label={confirmButtonLabel}
        />
        <Button className="btn modal-footer__item" onClick={onClose} label="common.close" />
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

NodeDefEntitySelectorDialog.defaultProps = {
  canSelectCurrentEntity: true,
}
