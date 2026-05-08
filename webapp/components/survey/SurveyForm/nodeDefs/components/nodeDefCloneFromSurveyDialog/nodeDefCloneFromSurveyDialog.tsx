import './nodeDefCloneFromSurveyDialog.scss'

import React, { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { FormItem } from '@webapp/components/form/Input'
import { Button, ButtonCancel } from '@webapp/components/buttons'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { SurveyEntitiesTreeView, SourceEntitySelection } from './surveyEntitiesTreeView'

type ConfirmParams = {
  sourceSurveyId: number | string
  sourceNodeDefUuid: string
  targetParentNodeDefUuid: string
}

type NodeDefCloneFromSurveyDialogProps = {
  currentNodeDef: object
  onClose: () => void
  onConfirm: (params: ConfirmParams) => void
}

const targetEntityFilterFn = ({ cycle, entityDef }: { cycle: string; entityDef: object }): boolean =>
  NodeDef.isEntity(entityDef) && !NodeDefLayout.isRenderTable(cycle)(entityDef)

export const NodeDefCloneFromSurveyDialog = (props: NodeDefCloneFromSurveyDialogProps): React.ReactElement => {
  const { currentNodeDef, onClose, onConfirm } = props

  const cycle = useSurveyCycleKey()
  const i18n = useI18n()
  const surveyCurrent = useSurvey()

  const surveyCurrentHierarchy = Survey.getHierarchy()(surveyCurrent)

  const [sourceEntitySelection, setSourceEntitySelection] = useState<SourceEntitySelection | null>(null)
  const [targetEntityDefUuid, setTargetEntityDefUuid] = useState<string>(NodeDef.getUuid(currentNodeDef))

  const onConfirmClick = useCallback(() => {
    onConfirm({
      sourceSurveyId: sourceEntitySelection!.surveyId,
      sourceNodeDefUuid: sourceEntitySelection!.nodeDefUuid,
      targetParentNodeDefUuid: targetEntityDefUuid,
    })
  }, [onConfirm, sourceEntitySelection, targetEntityDefUuid])

  const confirmButtonDisabled = !sourceEntitySelection || !targetEntityDefUuid

  return (
    <Modal
      className="survey-form__node-def-clone-from-survey-dialog"
      onClose={onClose}
      showCloseButton
      title={i18n.t('surveyForm.cloneFromAnotherSurvey.title')}
    >
      <ModalBody>
        <FormItem label={<span>Source entity</span>}>
          <div className="clone-from-survey-dialog__tree-view-container">
            <SurveyEntitiesTreeView
              selectedSourceEntity={sourceEntitySelection}
              onSourceEntitySelectionChange={setSourceEntitySelection}
            />
          </div>
        </FormItem>

        <FormItem label={<span>Target entity (current survey)</span>}>
          <EntitySelector
            filterFn={(entityDef: object) => targetEntityFilterFn({ cycle, entityDef })}
            hierarchy={surveyCurrentHierarchy}
            nodeDefLabelType={NodeDef.NodeDefLabelTypes.labelAndName}
            nodeDefUuidEntity={targetEntityDefUuid}
            onChange={setTargetEntityDefUuid}
            showSingleEntities
          />
        </FormItem>
      </ModalBody>

      <ModalFooter>
        <ButtonCancel className="modal-footer__item" onClick={onClose} />
        <Button
          className="modal-footer__item"
          disabled={confirmButtonDisabled}
          label="Confirm"
          labelIsI18nKey={false}
          onClick={onConfirmClick}
        />
      </ModalFooter>
    </Modal>
  )
}
