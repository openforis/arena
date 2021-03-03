import './nodeDefBoolean.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

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
        data-value={value}
        aria-disabled={disabled || !canEditRecord || readOnly}
        onClick={() => (checked ? null : updateNode(nodeDef, node, value))}
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
      {['true', 'false'].map((value) => (
        <Button
          key={value}
          disabled={edit}
          label={i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`)}
          value={value}
        />
      ))}
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
