import type { Labels, NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SamplingNodeDefs } from './samplingNodeDefs'

type AnyNodeDef = ArenaNodeDef<NodeDefType>

const getName = ({ estimatedOfNodeDef }: { estimatedOfNodeDef: AnyNodeDef }): string =>
  `${NodeDef.getName(estimatedOfNodeDef)}_ha`

const getLabels = ({ estimatedOfNodeDef }: { estimatedOfNodeDef: AnyNodeDef }): Labels => {
  const labels: Labels = {}
  for (const [lang, label] of Object.entries(NodeDef.getLabels(estimatedOfNodeDef))) {
    labels[lang] = `${label} (ha)`
  }
  return labels
}

const getScript = ({ survey, estimatedOfNodeDef }: { survey: ArenaSurvey; estimatedOfNodeDef: AnyNodeDef }): string => {
  const nodeDefName = getName({ estimatedOfNodeDef })
  const nodeDefParent = Survey.getNodeDefParent(estimatedOfNodeDef)(survey)
  const parentName = NodeDef.getName(nodeDefParent)

  const estimatedOfNodeDefName = NodeDef.getName(estimatedOfNodeDef)
  const samplingNodeDefName = SamplingNodeDefs.getEntityAreaNodeDefName({ nodeDefParent })

  return `${parentName}$${nodeDefName} <- ${parentName}$${estimatedOfNodeDefName} / ${parentName}$${samplingNodeDefName}`
}

const newNodeDef = ({
  survey,
  chainUuid,
  estimatedOfNodeDef,
}: {
  survey: ArenaSurvey
  chainUuid: string
  estimatedOfNodeDef: AnyNodeDef
}): AnyNodeDef => {
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
    [NodeDef.keysPropsAdvanced.script]: getScript({ survey, estimatedOfNodeDef }),
  }

  const analysis = true
  const virtual = false
  const nodeDefType = NodeDef.nodeDefType.decimal

  return NodeDef.newNodeDef(nodeDefParent, nodeDefType, cycleKeys, props, advancedProps, analysis, virtual)
}

const updateNodeDef = ({
  survey,
  nodeDefAreaBasedEstimate,
  areaBasedEstimatedOfNodeDef,
}: {
  survey: ArenaSurvey
  nodeDefAreaBasedEstimate: AnyNodeDef
  areaBasedEstimatedOfNodeDef: AnyNodeDef
}): AnyNodeDef => {
  const name = getName({ estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })
  const labels = getLabels({ estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })
  const script = getScript({ survey, estimatedOfNodeDef: areaBasedEstimatedOfNodeDef })

  return A.pipe(
    NodeDef.assocProp({ key: NodeDef.propKeys.name, value: name }),
    NodeDef.assocProp({ key: NodeDef.propKeys.labels, value: labels }),
    NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.script, value: script }),
    NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.active, value: NodeDef.isActive(areaBasedEstimatedOfNodeDef) })
  )(nodeDefAreaBasedEstimate)
}

export const AreaBasedEstimatedOfNodeDef = {
  getName,
  getScript,
  newNodeDef,
  updateNodeDef,
}
