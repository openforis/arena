import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { FormItem } from '@webapp/components/form/Input'
import { Button, ButtonDelete } from '@webapp/components/buttons'
import { RecordPageStatusIcon } from '@webapp/components/survey/SurveyForm/components/RecordPageStatusIcon'

import { DialogConfirmActions } from '@webapp/store/ui'
import { useI18n, useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useEntitySubtreeStatus } from '@webapp/store/ui/record'
import { useNodeKeysLabelValues } from '@webapp/store/ui/surveyForm'

import { TestId } from '@webapp/utils/testId'

const PLACEHOLDER_VALUE = 'placeholder'

/**
 * Renders one entity dropdown option row with its subtree status icon.
 * @param {object} props - Component props
 * @param {string} props.nodeUuid - Entity node UUID
 * @param {string} props.label - Display label for the entity
 * @returns {React.ReactElement} Option label row
 */
const EntitySelectOptionLabel = ({ nodeUuid, label }) => {
  const { hasErrors, hasWarnings, isComplete } = useEntitySubtreeStatus(nodeUuid)
  return (
    <span className="node-select-option">
      <span className="node-select-option__label">{label}</span>
      <RecordPageStatusIcon hasErrors={hasErrors} hasWarnings={hasWarnings} isComplete={isComplete} />
    </span>
  )
}

const NodeDefEntityFormNodeSelect = (props) => {
  const { nodeDef, nodes, parentNode, selectedNode, updateNode, removeNode, onChange, canAddNode, canDeleteNode } =
    props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const dispatch = useDispatch()
  const experimentalFeatures = useSystemConfigExperimentalFeatures()

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

  const selectedValue = selectedNode ? Node.getUuid(selectedNode) : PLACEHOLDER_VALUE

  const renderSelectedValue = useCallback(
    (value) => {
      if (!value || value === PLACEHOLDER_VALUE) {
        return i18n.t('common.select')
      }
      const index = nodes.findIndex((n) => Node.getUuid(n) === value)
      const label = index >= 0 ? nodeKeysLabelValues[index] : value
      return <EntitySelectOptionLabel nodeUuid={value} label={label} />
    },
    [i18n, nodeKeysLabelValues, nodes]
  )

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
            {experimentalFeatures ? (
              <Select
                className="node-select"
                data-testid={TestId.entities.form.nodeSelect}
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
                displayEmpty
                renderValue={renderSelectedValue}
                disabled={R.isEmpty(nodes)}
                variant="standard"
                disableUnderline
              >
                <MenuItem value={PLACEHOLDER_VALUE} disabled hidden>
                  {i18n.t('common.select')}
                </MenuItem>
                {nodes.map((n, index) => (
                  <MenuItem
                    key={Node.getUuid(n)}
                    value={Node.getUuid(n)}
                    data-testid={TestId.entities.form.nodeSelectOption(index)}
                  >
                    <EntitySelectOptionLabel nodeUuid={Node.getUuid(n)} label={nodeKeysLabelValues[index]} />
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <select
                className="node-select"
                data-testid={TestId.entities.form.nodeSelect}
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
                aria-disabled={R.isEmpty(nodes)}
              >
                <option value={PLACEHOLDER_VALUE} disabled hidden={true}>
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
            )}
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
