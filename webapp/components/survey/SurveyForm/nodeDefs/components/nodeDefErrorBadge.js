import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { TestId } from '@webapp/utils/testId'

import ErrorBadge from '@webapp/components/errorBadge'

import useValidation from './useValidation'

const NodeDefErrorBadge = (props) => {
  const {
    children = null,
    edit = false,
    insideTable = false,
    node = null,
    nodeDef,
    nodes = null,
    parentNode = null,
  } = props
  const validation = useValidation({ edit, node, nodeDef, nodes, parentNode })

  return (
    <ErrorBadge
      validation={validation}
      showIcon
      showLabel={false}
      showKeys={false}
      className="error-badge-inverse survey-form__node-def-error-badge"
      id={TestId.surveyForm.nodeDefErrorBadge(NodeDef.getName(nodeDef))}
      insideTable={insideTable}
    >
      {children}
    </ErrorBadge>
  )
}

NodeDefErrorBadge.propTypes = {
  children: PropTypes.node,
  edit: PropTypes.bool,
  insideTable: PropTypes.bool,
  node: PropTypes.object, // Passed when validating a single node of a nodeDef multiple
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.object,
}

export default NodeDefErrorBadge
