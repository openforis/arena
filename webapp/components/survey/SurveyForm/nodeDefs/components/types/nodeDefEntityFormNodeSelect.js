import React from 'react'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

import { Button } from '@webapp/components/buttons'
import { FormItem } from '@webapp/components/form/Input'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

const NodeDefEntityFormNodeSelect = (props) => {
  const { nodeDef, nodes, parentNode, selectedNode, updateNode, removeNode, onChange, canEditRecord, canAddNode } =
    props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const dispatch = useDispatch()

  const nodeDefName = NodeDef.getLabel(nodeDef, lang)

  return (
    <div className="survey-form__node-def-entity-form-header">
      {canEditRecord && (
        <Button
          testId={TestId.entities.form.addNewNode}
          size="small"
          onClick={() => {
            const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
            updateNode(nodeDef, entity)
            onChange(Node.getUuid(entity))
          }}
          disabled={!canAddNode}
          iconClassName="icon-plus icon-10px icon-left"
          label={i18n.t('surveyForm.nodeDefEntityForm.addNewEntity', { name: nodeDefName })}
        />
      )}
      {nodes.length > 0 && (
        <>
          <FormItem
            className="node-select-form-item"
            label={
              selectedNode
                ? i18n.t('surveyForm.nodeDefEntityForm.selectedEntity', { name: nodeDefName })
                : i18n.t('surveyForm.nodeDefEntityForm.select', { name: nodeDefName })
            }
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
                  {dispatch(SurveyFormActions.getNodeKeyLabelValues(nodeDef, n))}
                </option>
              ))}
            </select>
          </FormItem>

          {canEditRecord && (
            <Button
              size="small"
              style={{ marginLeft: '50px' }}
              disabled={!selectedNode}
              onClick={() => {
                dispatch(
                  DialogConfirmActions.showDialogConfirm({
                    key: 'surveyForm.nodeDefEntityForm.confirmDelete',
                    onOk: () => {
                      onChange(null)
                      removeNode(nodeDef, selectedNode)
                    },
                  })
                )
              }}
              iconClassName="icon-bin icon-10px icon-left"
              label="common.delete"
            />
          )}
        </>
      )}
    </div>
  )
}

export default NodeDefEntityFormNodeSelect
