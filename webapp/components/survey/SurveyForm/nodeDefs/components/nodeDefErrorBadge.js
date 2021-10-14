import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { TestId } from '@webapp/utils/testId'

import ErrorBadge from '@webapp/components/errorBadge'

import useValidation from './useValidation'

const NodeDefErrorBadge = (props) => {
  const { children, edit, node, nodeDef, nodes, parentNode, insideTable} = props
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
  node: PropTypes.object, // Passed when validating a single node of a nodeDef multiple
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.object,
}

NodeDefErrorBadge.defaultProps = {
  children: null,
  edit: false,
  node: null,
  nodes: null,
  parentNode: null,
}

export default NodeDefErrorBadge
