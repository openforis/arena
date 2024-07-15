import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'

export default (props) => {
  const { edit, node, nodeDef, nodes, parentNode } = props

  return useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    if (edit) {
      return Survey.getNodeDefValidation(nodeDef)(survey)
    }
    const record = RecordState.getRecord(state)
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
      if (NodeDef.isCode(nodeDef)) {
        const firstNodeValidation = RecordValidation.getNodeValidation(nodes[0])(recordValidation)
        const allNodesValidationsEqual = nodes.every((node) =>
          Objects.isEqual(RecordValidation.getNodeValidation(node)(recordValidation), firstNodeValidation)
        )
        if (allNodesValidationsEqual) {
          return firstNodeValidation
        }
      }
      if (
        nodes.some((node) => {
          const nodeValidation = RecordValidation.getNodeValidation(node)(recordValidation)
          return Validation.isNotValid(nodeValidation)
        })
      ) {
        return Validation.newInstance(false, {}, [{ key: Validation.messageKeys.record.oneOrMoreInvalidValues }])
      }
    } else if (!Objects.isEmpty(nodes)) {
      return RecordValidation.getNodeValidation(nodes[0])(recordValidation)
    }
    return Validation.newInstance()
  }, Objects.isEqual)
}
