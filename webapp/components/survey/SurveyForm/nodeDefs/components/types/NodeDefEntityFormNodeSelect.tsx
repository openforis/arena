import { useCallback, useMemo } from 'react'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import { Button, ButtonDelete } from '@webapp/components/buttons'
import Dropdown from '@webapp/components/form/Dropdown'
import { FormItem } from '@webapp/components/form/Input'
import { RecordPageStatusIcon } from '@webapp/components/survey/SurveyForm/components/RecordPageStatusIcon'
import { useAppDispatch } from '@webapp/store'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useEntitySubtreeStatus } from '@webapp/store/ui/record'
import { useNodeKeysLabelValues } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

/**
 * Renders one entity dropdown option row with its subtree status icon.
 * @param {object} props - Component props
 * @param {string} props.nodeUuid - Entity node UUID
 * @param {string} props.label - Display label for the entity
 * @returns {ReactElement} Option label row
 */
type EntitySelectOptionLabelProps = {
  nodeUuid: string
  label: string
}

const EntitySelectOptionLabel = ({ nodeUuid, label }: EntitySelectOptionLabelProps) => {
  const { hasErrors, hasWarnings, isComplete } = useEntitySubtreeStatus(nodeUuid)
  return (
    <span className="node-select-option">
      <span className="node-select-option__label dropdown-option__label">{label}</span>
      <RecordPageStatusIcon hasErrors={hasErrors} hasWarnings={hasWarnings} isComplete={isComplete} />
    </span>
  )
}

/**
 * Renders the label of an entity option (or of the selected entity) with its subtree status icon.
 * @param {object} params - The Dropdown render params.
 * @param {object} params.data - The entity item.
 */
const renderEntityLabel = ({ data }) => <EntitySelectOptionLabel nodeUuid={data.value} label={data.label} />

type EntitySelectWithStatusProps = {
  selectedValue: string | null
  onChange: (nodeUuid: string) => void
  nodes: any[]
  nodeKeysLabelValues: string[]
  placeholderLabel: string
}

/**
 * Entity instance selector with per-instance status icons.
 */
const EntitySelectWithStatus = ({
  selectedValue,
  onChange,
  nodes,
  nodeKeysLabelValues,
  placeholderLabel,
}: EntitySelectWithStatusProps) => {
  const items = useMemo(
    () => nodes.map((node, index) => ({ value: Node.getUuid(node), label: nodeKeysLabelValues[index] })),
    [nodeKeysLabelValues, nodes]
  )
  const selection = items.find((item) => item.value === selectedValue) ?? null

  return (
    <Dropdown
      className="node-select"
      clearable={false}
      items={items}
      onChange={(item) => onChange(item.value)}
      placeholder={placeholderLabel}
      renderOptionLabel={renderEntityLabel}
      renderSelectedLabel={renderEntityLabel}
      selection={selection}
      testId={TestId.entities.form.nodeSelect}
    />
  )
}

const NodeDefEntityFormNodeSelect = (props) => {
  const { nodeDef, nodes, parentNode, selectedNode, updateNode, removeNode, onChange, canAddNode, canDeleteNode } =
    props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const dispatch = useAppDispatch()

  const nodeDefName = NodeDef.getLabel(nodeDef, lang)
  const nodeKeysLabelValues = useNodeKeysLabelValues(nodeDef, nodes, { includeSummaryAttributes: true })
  const selectedValue = selectedNode ? Node.getUuid(selectedNode) : null
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
          iconName="add"
          iconSize={12}
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
            <EntitySelectWithStatus {...selectProps} />
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
