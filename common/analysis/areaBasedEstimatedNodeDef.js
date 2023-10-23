import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SamplingNodeDefs } from './samplingNodeDefs'

const getName = ({ estimatedOfNodeDef }) => `${NodeDef.getName(estimatedOfNodeDef)}_ha`

const getLabels = ({ estimatedOfNodeDef }) =>
  Object.entries(NodeDef.getLabels(estimatedOfNodeDef)).reduce((acc, [lang, label]) => {
    acc[lang] = `${label} (ha)`
    return acc
  }, {})

const getScript = ({ survey, chain, estimatedOfNodeDef }) => {
  const nodeDefName = getName({ estimatedOfNodeDef })
  const nodeDefParent = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)
  const parentName = NodeDef.getName(nodeDefParent)

  const estimatedOfNodeDefName = NodeDef.getName(estimatedOfNodeDef)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const samplingNodeDefName = SamplingNodeDefs.getEntityAreaNodeDefName({ nodeDefParent, baseUnitNodeDef })

  return `${parentName}$${nodeDefName} <- ${parentName}$${estimatedOfNodeDefName} / ${parentName}$${samplingNodeDefName}`
}

const newNodeDef = ({ survey, chainUuid, estimatedOfNodeDef }) => {
  const cycleKeys = Survey.getCycleKeys(Survey.getSurveyInfo(survey))
  const nodeDefParent = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)

  const props = {
    [NodeDef.propKeys.name]: getName({ estimatedOfNodeDef }),
    [NodeDef.propKeys.labels]: getLabels({ estimatedOfNodeDef }),
  }

  const advancedProps = {
    [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
    [NodeDef.keysPropsAdvanced.active]: true,
    [NodeDef.keysPropsAdvanced.isBaseUnit]: false,
    [NodeDef.keysPropsAdvanced.isSampling]: true,
    [NodeDef.keysPropsAdvanced.areaBasedEstimatedOf]: NodeDef.getUuid(estimatedOfNodeDef),
    [NodeDef.keysPropsAdvanced.script]: getScript({
      survey,
      chainUuid,
      estimatedOfNodeDef,
    }),
  }

  const analysis = true
  const virtual = false
  const nodeDefType = NodeDef.nodeDefType.decimal

  return NodeDef.newNodeDef(nodeDefParent, nodeDefType, cycleKeys, props, advancedProps, analysis, virtual)
}

const updateNodeDef = ({ survey, chain, nodeDefAreaBasedEstimate, areaBasedEstimatedOfNodeDef }) => {
  const name = getName({ estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })
  const labels = getLabels({ estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })
  const script = getScript({
    survey,
    chain,
    estimatedOfNodeDef: areaBasedEstimatedOfNodeDef,
  })

  return A.pipe(
    NodeDef.assocProp({ key: NodeDef.propKeys.name, value: name }),
    NodeDef.assocProp({ key: NodeDef.propKeys.labels, value: labels }),
    NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.script, value: script })
  )(nodeDefAreaBasedEstimate)
}

export const AreaBasedEstimatedOfNodeDef = {
  getName,
  getScript,
  newNodeDef,
  updateNodeDef,
}
