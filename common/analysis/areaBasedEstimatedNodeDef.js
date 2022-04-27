import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

const getName = ({ estimatedOfNodeDef }) => `${NodeDef.getName(estimatedOfNodeDef)}_ha`

const getScript = ({ survey, chainUuid, estimatedOfNodeDef }) => {
  const nodeDefName = getName({ estimatedOfNodeDef })
  const nodeDefParent = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)
  const parentName = NodeDef.getName(nodeDefParent)

  const samplingNodeDefInParent = Survey.getSamplingNodeDefChild({ nodeDefParent, chainUuid })(survey)

  return `${parentName}$${nodeDefName} <- ${parentName}$${NodeDef.getName(
    estimatedOfNodeDef
  )} / ${parentName}$${NodeDef.getName(samplingNodeDefInParent)}`
}

const newNodeDef = ({ survey, cycleKeys, chainUuid, estimatedOfNodeDef }) => {
  const nodeDefParent = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)

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

  return NodeDef.newNodeDef(nodeDefParent, nodeDefType, cycleKeys, props, advancedProps, temporary, virtual)
}

export const AreaBasedEstimatedOfNodeDef = {
  getName,
  getScript,
  newNodeDef,
}
