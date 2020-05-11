import React from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { useSurvey } from '@webapp/commonComponents/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

import * as RecordState from '@webapp/loggedin/surveyViews/record/recordState'

const _getValidation = (props) => {
  const { edit, node, nodeDef, nodes, parentNode } = props

  if (edit) {
    const survey = useSurvey()
    return Survey.getNodeDefValidation(nodeDef)(survey)
  }
  const record = useSelector(RecordState.getRecord)
  const recordValidation = Record.getValidation(record)

  if (NodeDef.isMultiple(nodeDef)) {
    // Showing validation for a single node instance of multiple nodeDef
    if (node) {
      return RecordValidation.getNodeValidation(node)(recordValidation)
    }
    if (NodeDef.isEntity(nodeDef)) {
      // Only entities can have children with min/max count validation
      return RecordValidation.getValidationChildrenCount(
        Node.getUuid(parentNode),
        NodeDef.getUuid(nodeDef)
      )(recordValidation)
    }
    if (!R.all(Validation.isValid)(nodes)) {
      return Validation.newInstance(false, {}, [{ key: Validation.messageKeys.record.oneOrMoreInvalidValues }])
    }
  } else if (!R.isEmpty(nodes)) {
    return RecordValidation.getNodeValidation(nodes[0])(recordValidation)
  }

  return Validation.newInstance()
}

const NodeDefErrorBadge = (props) => {
  const { children, edit, node, nodeDef, nodes, parentNode } = props
  const validation = _getValidation({ edit, node, nodeDef, nodes, parentNode })

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
