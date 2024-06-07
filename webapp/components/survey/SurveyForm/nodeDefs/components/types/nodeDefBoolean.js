import './nodeDefBoolean.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

import { Radiobox } from '@webapp/components/form'

const NodeDefBoolean = (props) => {
  const { edit, entry, canEditRecord, nodeDef, nodes, readOnly, updateNode } = props

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, '')

  return (
    <div className="survey-form__node-def-boolean">
      {['true', 'false'].map((value) => {
        const checked = nodeValue == value
        return (
          <Radiobox
            key={value}
            checked={checked}
            data-value={value}
            disabled={edit || !canEditRecord || readOnly}
            label={`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`}
            onChange={() => updateNode(nodeDef, node, checked ? null : value)}
            size="small"
          />
        )
      })}
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
