import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import ErrorBadge from '../../../../../commonComponents/errorBadge'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Record from '../../../../../../common/record/record'
import RecordValidation from '../../../../../../common/record/recordValidation'
import Validator from '../../../../../../common/validation/validator'

import * as RecordState from '../../../record/recordState'

const NodeDefErrorBadge = props => {
  const { edit, nodeDef, validation, container } = props

  // update parent container invalid class
  const containerEl = container.current

  const canToggleClass = NodeDef.isAttribute(nodeDef) && containerEl
  if (canToggleClass) {
    if (Validator.isValidationValid(validation)) {
      containerEl.parentNode.classList.remove('survey-form__node-def-invalid')
    } else {
      containerEl.parentNode.classList.add('survey-form__node-def-invalid')
    }
  }

  return (
    <ErrorBadge
      validation={validation}
      showLabel={false}
      showKeys={false}
      className="error-badge-inverse"
    />
  )
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, nodes, node, edit } = props

  let validation = Validator.validValidation

  if (edit) {
    validation = Validator.getValidation(nodeDef)
  } else {
    const recordValidation = R.pipe(
      RecordState.getRecord,
      Record.getValidation
    )(state)

    if (NodeDef.isMultiple(nodeDef)) {
      // showing validation for a single node instance of multiple nodeDef
      if (node) {
        validation = RecordValidation.getNodeValidation(node)(recordValidation)
      } else {
        validation = RecordValidation.getValidationChildrenCount(parentNode, nodeDef)(recordValidation)
      }
    } else if (!R.isEmpty(nodes)) {
      validation = RecordValidation.getNodeValidation(nodes[0])(recordValidation)
    }
  }

  return {
    validation,
  }
}

NodeDefErrorBadge.defaultProps = {
  nodes: null,
  // singe node is passed in nodeDefText Multiple
  node: null,
}

export default connect(
  mapStateToProps,
)(NodeDefErrorBadge)
