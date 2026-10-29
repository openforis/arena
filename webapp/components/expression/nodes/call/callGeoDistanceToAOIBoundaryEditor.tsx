import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'

import { Alert } from '@webapp/components/Alert'
import { useSurveyInfo } from '@webapp/store/survey'

import { CallSingleParameterEditor } from './callSingleParameterEditor'

type Variable = { root?: boolean; nodeDefType?: string }

type Props = {
  expressionNode?: object
  onConfirm: (expressionNode: object) => void
  variables: Variable[]
}

const coordinateVarFilterFn = (variable: Variable): boolean =>
  !!variable.root || variable.nodeDefType === NodeDef.nodeDefType.coordinate

export const CallGeoDistanceToAOIBoundaryEditor = (props: Props) => {
  const { expressionNode, onConfirm, variables } = props

  const surveyInfo = useSurveyInfo()
  const areaOfInterestDefined = !!SurveyAreaOfInterest.getAreaOfInterestFileUuid(surveyInfo)

  return (
    <div className="function-editor">
      {!areaOfInterestDefined && (
        <Alert severity="warning" text="expressionEditor.geoDistanceToAOIBoundaryEditor.areaOfInterestNotDefined" />
      )}
      <CallSingleParameterEditor
        callee={Expression.functionNames.geoDistanceToAOIBoundary}
        expressionNode={expressionNode}
        label="expressionEditor.coordinateAttribute"
        onConfirm={onConfirm}
        variables={variables}
        variablesFilterFn={coordinateVarFilterFn}
      />
    </div>
  )
}
