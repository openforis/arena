import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'

import ErrorBadge from '@webapp/commonComponents/errorBadge'

import useValidation from './useValidation'

const NodeDefErrorBadge = (props) => {
  const { children, edit, node, nodeDef, nodes, parentNode } = props
  const validation = useValidation({ edit, node, nodeDef, nodes, parentNode })

  const valid = Validation.isValid(validation)

  if (valid && children) {
    return children
  }
  if (!valid) {
    return (
      <ErrorBadge
        validation={validation}
        showLabel={false}
        showKeys={false}
        className="error-badge-inverse survey-form__node-def-error-badge"
      >
        {children}
      </ErrorBadge>
    )
  }
  return null
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
