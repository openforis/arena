import * as Expression from '@core/expressionParser/expression'

import { AreasOfInterestNotDefinedWarning, coordinateVarFilterFn } from './callGeoDistanceToAOIBoundaryEditor'
import { CallSingleParameterEditor } from './callSingleParameterEditor'

type Props = {
  expressionNode?: object
  onConfirm: (expressionNode: object) => void
  variables: object[]
}

export const CallGeoAOIContainingEditor = (props: Props) => {
  const { expressionNode, onConfirm, variables } = props

  return (
    <div className="function-editor">
      <AreasOfInterestNotDefinedWarning />
      <CallSingleParameterEditor
        callee={Expression.functionNames.geoAOIContaining}
        expressionNode={expressionNode}
        label="expressionEditor.coordinateAttribute"
        onConfirm={onConfirm}
        variables={variables}
        variablesFilterFn={coordinateVarFilterFn}
      />
    </div>
  )
}
