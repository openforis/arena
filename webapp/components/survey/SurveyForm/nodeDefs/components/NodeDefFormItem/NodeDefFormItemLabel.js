import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { TestId } from '@webapp/utils/testId'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'
import NodeDefAttributeLockToggle from '../NodeDefAttributeLockToggle'

const NodeDefFormItemLabel = (props) => {
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

NodeDefFormItemLabel.propTypes = {
  edit: PropTypes.bool.isRequired,
  keyFieldLocked: PropTypes.bool,
  keyFieldLockVisible: PropTypes.bool,
  label: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  onKeyFieldLockToggle: PropTypes.func,
  onQualifierFieldLockToggle: PropTypes.func,
  parentNode: PropTypes.object,
  qualifierFieldLocked: PropTypes.bool,
  qualifierFieldLockVisible: PropTypes.bool,
}

export default NodeDefFormItemLabel
