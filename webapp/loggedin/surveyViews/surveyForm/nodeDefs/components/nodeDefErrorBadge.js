import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import ErrorBadge from '@webapp/commonComponents/errorBadge'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import * as SurveyState from '@webapp/survey/surveyState'
import * as RecordState from '../../../record/recordState'

const NodeDefErrorBadge = props => {
  const { validation, children } = props

  const valid = Validation.isValid(validation)

  return valid && children ? (
    children
  ) : !valid ? (
    <ErrorBadge
      validation={validation}
      showLabel={false}
      showKeys={false}
      className="error-badge-inverse survey-form__node-def-error-badge"
    >
      {children}
    </ErrorBadge>
  ) : null
}

NodeDefErrorBadge.defaultProps = {
  nodeDef: null,
  parentNode: null,
  nodes: null,
  node: null, // Passed when validating a single node of a nodeDef multiple
  edit: false,
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, nodes, node, edit } = props

  let validation = Validation.newInstance()

  if (edit) {
    const survey = SurveyState.getSurvey(state)
    validation = Survey.getNodeDefValidation(nodeDef)(survey)
  } else {
    const recordValidation = R.pipe(RecordState.getRecord, Record.getValidation)(state)

    if (NodeDef.isMultiple(nodeDef)) {
      // Showing validation for a single node instance of multiple nodeDef
      if (node) {
        validation = RecordValidation.getNodeValidation(node)(recordValidation)
      } else if (NodeDef.isEntity(nodeDef)) {
        // Only entities can have children with min/max count validation
        validation = RecordValidation.getValidationChildrenCount(parentNode, nodeDef)(recordValidation)
      } else if (!R.all(Validation.isValid)(nodes)) {
        validation = Validation.newInstance(false, {}, [{ key: Validation.messageKeys.record.oneOrMoreInvalidValues }])
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
