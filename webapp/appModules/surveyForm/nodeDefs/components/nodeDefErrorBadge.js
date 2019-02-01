import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import ErrorBadge from '../../../../commonComponents/errorBadge'

import NodeDef from '../../../../../common/survey/nodeDef'
import Record from '../../../../../common/record/record'
import RecordValidation from '../../../../../common/record/recordValidation'
import Node from '../../../../../common/record/node'
import Validator from '../../../../../common/validation/validator'

import * as SurveyFormState from '../../surveyFormState'
import * as RecordState from '../../record/recordState'

const NodeDefErrorBadge = props => {
  const { edit, nodeDef, validation, container } = props

  // update parent container invalid class
  const containerEl = container.current

  if (NodeDef.isNodeDefAttribute(nodeDef) && containerEl) {
    if (Validator.isValidationValid(validation)) {
      containerEl.classList.remove('node-def__invalid')
    } else {
      containerEl.classList.add('node-def__invalid')
    }
  }

  return <ErrorBadge validation={validation} showLabel={edit}/>
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, nodes, node, edit } = props

  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)

  let validation = Validator.validValidation

  if (edit) {
    validation = Validator.getValidation(nodeDef)
  } else {
    const recordValidation = Record.getValidation(record)

    if (NodeDef.isNodeDefSingle(nodeDef)) {
      if (!R.isEmpty(nodes))
        validation = RecordValidation.getSingleNodeValidation(nodes[0])(recordValidation)
    } else if (node) {
      // "node" will be available only for multiple attributes
      validation = RecordValidation.getSingleNodeValidation(node)(recordValidation)
    } else {
      validation = RecordValidation.getMultipleNodeValidation(parentNode, nodeDef)(recordValidation)
    }
  }

  return {
    validation
  }
}

NodeDefErrorBadge.defaultProps = {
  nodes: null,
  node: null,
}

export default connect(
  mapStateToProps,
)(NodeDefErrorBadge)
