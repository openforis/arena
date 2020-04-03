import './nodeDefBoolean.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Node from '@core/record/node'

import { useI18n } from '@webapp/commonComponents/hooks'

const Button = (props) => {
  const { nodeDef, nodes, value, label, readOnly, disabled, updateNode, entry, canEditRecord } = props

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, '')
  const checked = nodeValue === value

  return (
    <button
      type="button"
      className="btn btn-s btn-transparent flex-center"
      aria-disabled={disabled || !canEditRecord || readOnly}
      onClick={() => updateNode(nodeDef, node, checked ? null : value)}
    >
      <span className={`icon icon-12px icon-radio-${checked ? 'checked2' : 'unchecked'} icon-left`} />
      {label}
    </button>
  )
}

Button.propTypes = {
  canEditRecord: PropTypes.bool,
  disabled: PropTypes.bool,
  entry: PropTypes.bool,
  label: PropTypes.string,
  nodeDef: PropTypes.any,
  nodes: PropTypes.array,
  readOnly: PropTypes.bool,
  updateNode: PropTypes.func,
  value: PropTypes.any,
}

Button.defaultProps = {
  canEditRecord: false,
  disabled: false,
  entry: false,
  label: null,
  nodeDef: null,
  nodes: [],
  readOnly: false,
  updateNode: null,
  value: null,
}

const NodeDefBoolean = (props) => {
  const { canEditRecord, edit, entry, nodeDef, nodes, readOnly, updateNode } = props

  const i18n = useI18n()

  return (
    <div className="survey-form__node-def-boolean">
      <Button
        canEditRecord={canEditRecord}
        disabled={edit}
        entry={entry}
        label={i18n.t('common.true')}
        nodeDef={nodeDef}
        nodes={nodes}
        readOnly={readOnly}
        updateNode={updateNode}
        value="true"
      />
      <Button
        canEditRecord={canEditRecord}
        disabled={edit}
        entry={entry}
        label={i18n.t('common.false')}
        nodeDef={nodeDef}
        nodes={nodes}
        readOnly={readOnly}
        updateNode={updateNode}
        value="false"
      />
    </div>
  )
}

NodeDefBoolean.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entry: PropTypes.bool,
  nodeDef: PropTypes.any,
  nodes: PropTypes.array,
  readOnly: PropTypes.bool,
  updateNode: PropTypes.func,
}

NodeDefBoolean.defaultProps = {
  canEditRecord: false,
  edit: false,
  entry: false,
  nodeDef: null,
  nodes: [],
  readOnly: false,
  updateNode: null,
}

export default NodeDefBoolean
