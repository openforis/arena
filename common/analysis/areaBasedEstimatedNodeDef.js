import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

const getName = ({ estimatedOfNodeDef }) => `${NodeDef.getName(estimatedOfNodeDef)}_ha`

const getScript = ({ survey, chainUuid, estimatedOfNodeDef }) => {
  const nodeDefName = getName({ estimatedOfNodeDef })
  const parentNodeDef = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)
  const parentName = NodeDef.getName(parentNodeDef)

  const samplingNodeDefInParent = Survey.getNodeDefsArray(survey).find(
    (_nodeDef) =>
      NodeDef.isSampling(_nodeDef) &&
      NodeDef.getParentUuid(_nodeDef) === NodeDef.getUuid(parentNodeDef) &&
      NodeDef.getChainUuid(_nodeDef) === chainUuid &&
      !NodeDef.isDeleted(_nodeDef)
  )

  return `${parentName}$${nodeDefName} <- ${parentName}$${NodeDef.getName(
    estimatedOfNodeDef
  )} / ${parentName}$${NodeDef.getName(samplingNodeDefInParent)}`
}

const newNodeDef = ({ survey, cycleKeys, chainUuid, estimatedOfNodeDef }) => {
  const parentNodeDef = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)

  const props = {
    [NodeDef.propKeys.name]: AreaBasedEstimatedOfNodeDef.getName({ estimatedOfNodeDef }),
  }

  const advancedProps = {
    [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
    [NodeDef.keysPropsAdvanced.active]: true,
    [NodeDef.keysPropsAdvanced.isBaseUnit]: false,
    [NodeDef.keysPropsAdvanced.isSampling]: true,
    [NodeDef.keysPropsAdvanced.areaBasedEstimatedOf]: NodeDef.getUuid(estimatedOfNodeDef),
    [NodeDef.keysPropsAdvanced.script]: AreaBasedEstimatedOfNodeDef.getScript({
      survey,
      chainUuid,
      estimatedOfNodeDef,
    }),
  }

  const temporary = true
  const virtual = false
  const nodeDefType = NodeDef.nodeDefType.decimal

  return NodeDef.newNodeDef(parentNodeDef, nodeDefType, cycleKeys, props, advancedProps, temporary, virtual)
}

export const AreaBasedEstimatedOfNodeDef = {
  getName,
  getScript,
  newNodeDef,
}
