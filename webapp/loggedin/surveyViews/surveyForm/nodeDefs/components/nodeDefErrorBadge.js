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
  const { validation, children } = props

  const valid = Validator.isValidationValid(validation)

  return valid && children
    ? (
      children
    )
    : !valid
      ? (
        <ErrorBadge
          validation={validation}
          showLabel={false}
          showKeys={false}
          className="error-badge-inverse survey-form__node-def-error-badge">
          {children}
        </ErrorBadge>
      )
      : null
}

NodeDefErrorBadge.defaultProps = {
  nodeDef: null,
  parentNode: null,
  nodes: null,
  node: null, // passed when validating a single node of a nodeDef multiple
  edit: false,
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
      } else if (NodeDef.isEntity(nodeDef)) {
        validation = RecordValidation.getValidationChildrenCount(parentNode, nodeDef)(recordValidation)
      } else if (!R.all(Validator.isValid)(nodes)) {
        validation = {
          [Validator.keys.valid]: false,
          [Validator.keys.errors]: [{ key: RecordValidation.keysError.atLeastOneInvalidValue }]
        }
      }
    } else if (!R.isEmpty(nodes)) {
      validation = RecordValidation.getNodeValidation(nodes[0])(recordValidation)
    }
  }

  return {
    validation,
  }
}

export default connect(mapStateToProps)(NodeDefErrorBadge)
