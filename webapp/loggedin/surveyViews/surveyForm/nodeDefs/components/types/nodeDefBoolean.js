import './nodeDefBoolean.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Node from '@core/record/node'

import { useI18n } from '@webapp/store/system'

const NodeDefBoolean = (props) => {
  const { edit, entry, canEditRecord, nodeDef, nodes, readOnly, updateNode } = props

  const i18n = useI18n()

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, '')

  const Button = ({ disabled, label, value }) => {
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
    disabled: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }

  return (
    <div className="survey-form__node-def-boolean">
      <Button disabled={edit} label={i18n.t('common.true')} value="true" />

      <Button disabled={edit} label={i18n.t('common.false')} value="false" />
    </div>
  )
}

NodeDefBoolean.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entry: PropTypes.bool,
  nodeDef: PropTypes.any.isRequired,
  nodes: PropTypes.array,
  readOnly: PropTypes.bool,
  updateNode: PropTypes.func.isRequired,
}

NodeDefBoolean.defaultProps = {
  canEditRecord: false,
  edit: false,
  entry: false,
  readOnly: false,
  nodes: null,
}

export default NodeDefBoolean
