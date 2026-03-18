import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { FormItem } from '@webapp/components/form/Input'
import { Button, ButtonDelete } from '@webapp/components/buttons'

import { DialogConfirmActions } from '@webapp/store/ui'
import { useI18n } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useNodeKeysLabelValues } from '@webapp/store/ui/surveyForm'

import { TestId } from '@webapp/utils/testId'

const NodeDefEntityFormNodeSelect = (props) => {
  const { nodeDef, nodes, parentNode, selectedNode, updateNode, removeNode, onChange, canAddNode, canDeleteNode } =
    props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const dispatch = useDispatch()

  const nodeDefName = NodeDef.getLabel(nodeDef, lang)

  const nodeKeysLabelValues = useNodeKeysLabelValues(nodeDef, nodes)

  const onDeleteClick = useCallback(() => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'surveyForm:nodeDefEntityForm.confirmDelete',
        onOk: () => {
          onChange(null)
          removeNode(nodeDef, selectedNode)
        },
      })
    )
  }, [dispatch, onChange, removeNode, nodeDef, selectedNode])

  return (
    <div className="survey-form__node-def-entity-form-header">
      {canAddNode && (
        <Button
          testId={TestId.entities.form.addNewNode}
          size="small"
          onClick={() => {
            const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
            updateNode(nodeDef, entity)
            onChange(Node.getUuid(entity))
          }}
          iconClassName="icon-plus icon-10px icon-left"
          label="surveyForm:nodeDefEntityForm.addNewEntity"
          labelParams={{ name: nodeDefName }}
        />
      )}
      {nodes.length > 0 && (
        <>
          <FormItem
            className="node-select-form-item"
            label={selectedNode ? 'surveyForm:nodeDefEntityForm.selectedEntity' : 'surveyForm:nodeDefEntityForm.select'}
            labelParams={{ name: nodeDefName }}
          >
            <select
              className="node-select"
              data-testid={TestId.entities.form.nodeSelect}
              value={selectedNode ? Node.getUuid(selectedNode) : 'placeholder'}
              onChange={(e) => onChange(e.target.value)}
              aria-disabled={R.isEmpty(nodes)}
            >
              <option value="placeholder" disabled hidden={true}>
                {i18n.t('common.select')}
              </option>
              {nodes.map((n, index) => (
                <option
                  key={Node.getUuid(n)}
                  value={Node.getUuid(n)}
                  data-testid={TestId.entities.form.nodeSelectOption(index)}
                >
                  {nodeKeysLabelValues[index]}
                </option>
              ))}
            </select>
          </FormItem>

          {canDeleteNode && (
            <ButtonDelete
              disabled={!selectedNode}
              onClick={onDeleteClick}
              size="small"
              style={{ marginLeft: '50px' }}
            />
          )}
        </>
      )}
    </div>
  )
}

export default NodeDefEntityFormNodeSelect
