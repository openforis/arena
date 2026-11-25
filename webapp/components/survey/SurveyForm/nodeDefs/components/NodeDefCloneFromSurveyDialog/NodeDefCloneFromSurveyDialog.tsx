import '../../../../cloneFromSurveyDialog.scss'
import './NodeDefCloneFromSurveyDialog.scss'

import React, { useCallback, useState } from 'react'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Survey from '@core/survey/survey'
import { Button, ButtonCancel } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/Modal'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { SourceNodeDefSelection, SurveyNodeDefsTreeView } from './SurveyNodeDefsTreeView'

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

const targetEntityFilterFn = ({ cycle, entityDef }: { cycle: string; entityDef: ArenaAnyNodeDef }): boolean =>
  NodeDef.isEntity(entityDef) && !NodeDefLayout.isRenderTable(cycle)(entityDef)

export const NodeDefCloneFromSurveyDialog = (props: NodeDefCloneFromSurveyDialogProps): React.ReactElement => {
  const { currentNodeDef, onClose, onConfirm } = props

  const cycle = useSurveyCycleKey()
  const surveyCurrent = useSurvey()

  const surveyCurrentHierarchy = Survey.getHierarchy()(surveyCurrent)

  const [sourceNodeDefSelection, setSourceNodeDefSelection] = useState<SourceNodeDefSelection | null>(null)
  const [targetEntityDefUuid, setTargetEntityDefUuid] = useState<string>(NodeDef.getUuid(currentNodeDef))

  const onConfirmClick = useCallback(() => {
    onConfirm({
      sourceSurveyId: sourceNodeDefSelection!.surveyId,
      sourceNodeDefUuid: sourceNodeDefSelection!.nodeDefUuid,
      targetParentNodeDefUuid: targetEntityDefUuid,
    })
  }, [onConfirm, sourceNodeDefSelection, targetEntityDefUuid])

  const confirmButtonDisabled = !sourceNodeDefSelection || !targetEntityDefUuid

  return (
    <Modal
      className="survey-form__node-def-clone-from-survey-dialog clone-from-survey-dialog"
      onClose={onClose}
      showCloseButton
      title="surveyForm:cloneFromAnotherSurvey.title"
    >
      <ModalBody>
        <FormItem label="surveyForm:cloneFromAnotherSurvey.sourceNode">
          <div className="clone-from-survey-dialog__tree-view-container">
            <SurveyNodeDefsTreeView
              selectedSourceNodeDef={sourceNodeDefSelection}
              onSourceNodeDefSelectionChange={setSourceNodeDefSelection}
            />
          </div>
        </FormItem>

        <FormItem label="surveyForm:cloneFromAnotherSurvey.targetEntityCurrentSurvey">
          <EntitySelector
            filterFn={(entityDef: ArenaAnyNodeDef) => targetEntityFilterFn({ cycle, entityDef })}
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
