import * as NodeDef from '@core/survey/nodeDef'

import { TestId } from '@webapp/utils/testId'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'
import NodeDefAttributeLockToggle from '../NodeDefAttributeLockToggle'
import type { NodeDefComponentProps, NodeDefFieldLockProps } from '../nodeDefComponentProps'

type NodeDefFormItemLabelProps = Omit<NodeDefComponentProps, 'updateNode'> &
  NodeDefFieldLockProps & {
    edit: boolean
    label: string
    lang: string
  }

const NodeDefFormItemLabel = (props: NodeDefFormItemLabelProps) => {
  const {
    nodeDef,
    label,
    lang,
    edit,
    keyFieldLocked = false,
    keyFieldLockVisible = false,
    nodes = [],
    onKeyFieldLockToggle = undefined,
    onQualifierFieldLockToggle = undefined,
    parentNode = null,
    qualifierFieldLocked = false,
    qualifierFieldLockVisible = false,
  } = props

  return (
    <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
      <NodeDefIconKey nodeDef={nodeDef} />
      <span>{label}</span>
      {keyFieldLockVisible && (
        <NodeDefAttributeLockToggle
          className="survey-form__node-def-attribute-lock-btn"
          locked={keyFieldLocked}
          onClick={onKeyFieldLockToggle}
          testId={TestId.surveyForm.keyLockToggle(NodeDef.getName(nodeDef))}
        />
      )}
      {qualifierFieldLockVisible && (
        <NodeDefAttributeLockToggle
          className="survey-form__node-def-attribute-lock-btn"
          locked={qualifierFieldLocked}
          onClick={onQualifierFieldLockToggle}
          testId={TestId.surveyForm.qualifierLockToggle(NodeDef.getName(nodeDef))}
          titleKeyPrefix="recordView.qualifierAttributeEditing"
        />
      )}
      <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
    </NodeDefErrorBadge>
  )
}

export default NodeDefFormItemLabel
