import { useSelector } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { useSurvey } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'

export default (props) => {
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
    if (NodeDefValidations.hasMinOrMaxCount(NodeDef.getValidations(nodeDef))) {
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
