import React from 'react'
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
  const { nodeDef, onChange, onClose } = props

  const i18n = useI18n()
  const survey = useSurvey()

  return (
    <Modal isOpen={true} className="survey-form__node-def-entity-selector-dialog" closeOnEsc={true} onClose={onClose}>
      <ModalHeader>{i18n.t('nodeDefEdit.cloneDialog.title', { nodeDefName: NodeDef.getName(nodeDef) })}</ModalHeader>

      <ModalBody>
        <FormItem label={i18n.t('nodeDefEdit.cloneDialog.entityToCloneInto')}>
          <EntitySelector hierarchy={Survey.getHierarchy()(survey)} onChange={onChange} showSingleEntities />
        </FormItem>
      </ModalBody>

      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.close" />
      </ModalFooter>
    </Modal>
  )
}

NodeDefEntitySelectorDialog.propTypes = {
  nodeDef: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}
