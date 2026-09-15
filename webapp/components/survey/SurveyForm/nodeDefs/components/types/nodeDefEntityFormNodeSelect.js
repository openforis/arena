import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

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

EntitySelectOptionLabel.propTypes = {
  nodeUuid: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
}

/**
 * Shared props for native and experimental entity instance selectors.
 * @typedef {object} EntitySelectProps
 * @property {string} selectedValue - Selected node UUID or placeholder
 * @property {(nodeUuid: string) => void} onChange - Called with the selected node UUID
 * @property {Array} nodes - Sibling entity nodes
 * @property {string[]} nodeKeysLabelValues - Display labels aligned with `nodes`
 * @property {string} placeholderLabel - Placeholder option text
 */

/**
 * Native `<select>` used when experimental features are off.
 * @param {EntitySelectProps} props - Select props
 * @returns {React.ReactElement} Native select
 */
const EntitySelectNative = ({ selectedValue, onChange, nodes, nodeKeysLabelValues, placeholderLabel }) => (
  <select
    className="node-select"
    data-testid={TestId.entities.form.nodeSelect}
    value={selectedValue}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value={PLACEHOLDER_VALUE} disabled hidden>
      {placeholderLabel}
    </option>
    {nodes.map((n, index) => (
      <option key={Node.getUuid(n)} value={Node.getUuid(n)} data-testid={TestId.entities.form.nodeSelectOption(index)}>
        {nodeKeysLabelValues[index]}
      </option>
    ))}
  </select>
)

EntitySelectNative.propTypes = {
  selectedValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  nodeKeysLabelValues: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholderLabel: PropTypes.string.isRequired,
}

/**
 * MUI Select with per-instance status icons (experimental features).
 * @param {EntitySelectProps} props - Select props
 * @returns {React.ReactElement} MUI select with status icons
 */
const EntitySelectWithStatus = ({ selectedValue, onChange, nodes, nodeKeysLabelValues, placeholderLabel }) => {
  const renderSelectedValue = useCallback(
    (value) => {
      if (!value || value === PLACEHOLDER_VALUE) {
        return placeholderLabel
      }
      const index = nodes.findIndex((n) => Node.getUuid(n) === value)
      const label = index >= 0 ? nodeKeysLabelValues[index] : placeholderLabel
      return <EntitySelectOptionLabel nodeUuid={value} label={label} />
    },
    [nodeKeysLabelValues, nodes, placeholderLabel]
  )

  return (
    <Select
      className="node-select"
      data-testid={TestId.entities.form.nodeSelect}
      value={selectedValue}
      onChange={(e) => onChange(e.target.value)}
      displayEmpty
      renderValue={renderSelectedValue}
      variant="standard"
      disableUnderline
    >
      <MenuItem value={PLACEHOLDER_VALUE} disabled hidden>
        {placeholderLabel}
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
  )
}

EntitySelectWithStatus.propTypes = {
  selectedValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  nodeKeysLabelValues: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholderLabel: PropTypes.string.isRequired,
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
  const selectedValue = selectedNode ? Node.getUuid(selectedNode) : PLACEHOLDER_VALUE
  const placeholderLabel = i18n.t('common.select')

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

  const selectProps = {
    selectedValue,
    onChange,
    nodes,
    nodeKeysLabelValues,
    placeholderLabel,
  }

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
              <EntitySelectWithStatus {...selectProps} />
            ) : (
              <EntitySelectNative {...selectProps} />
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
