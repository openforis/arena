import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'

const SAMPLING_NODE_DEF_BASE_UNIT_NAME = 'weight'

const getNodeDefName = ({ nodeDefParent, baseUnitNodeDef }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  return isBaseUnit
    ? SAMPLING_NODE_DEF_BASE_UNIT_NAME
    : `${NodeDef.getName(nodeDefParent)}_${NodeDef.getName(baseUnitNodeDef)}_area`
}

const newNodeDef = ({ nodeDefParent, baseUnitNodeDef, chainUuid, cycleKeys }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  const name = getNodeDefName({ nodeDefParent, baseUnitNodeDef })

  const props = {
    [NodeDef.propKeys.name]: name,
  }
  const parentName = NodeDef.getName(nodeDefParent)
  const defaultValue = isBaseUnit ? '1' : 'NA'
  const script = `${parentName}$${name} <- ${defaultValue}`

  const advancedProps = {
    [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
    [NodeDef.keysPropsAdvanced.active]: true,
    [NodeDef.keysPropsAdvanced.index]: -1,
    [NodeDef.keysPropsAdvanced.isBaseUnit]: isBaseUnit,
    [NodeDef.keysPropsAdvanced.isSampling]: true,
    [NodeDef.keysPropsAdvanced.script]: script,
  }
  const temporary = true
  const virtual = false
  return NodeDef.newNodeDef(
    nodeDefParent,
    NodeDef.nodeDefType.decimal,
    cycleKeys,
    props,
    advancedProps,
    temporary,
    virtual
  )
}

const newNodeDefs = ({ baseUnitNodeDef, survey, chain }) => {
  const cycleKeys = Survey.getCycleKeys(Survey.getSurveyInfo(survey))
  const descentants = Survey.getDescendants({ nodeDef: baseUnitNodeDef })(survey)
  const descendantEntities = descentants.filter(
    (descendantEntity) =>
      NodeDef.isEntity(descendantEntity) && (NodeDef.isMultiple(descendantEntity) || NodeDef.isRoot(descendantEntity))
  )

  const _samplingNodeDefsToCreate = [] // store nodeDefs to trigger to the backend
  const chainUuid = Chain.getUuid(chain)

  descendantEntities.forEach((entityDef) => {
    const samplingNodeDef = SamplingNodeDef.newNodeDef({
      nodeDefParent: entityDef,
      baseUnitNodeDef: baseUnitNodeDef,
      chainUuid,
      cycleKeys,
    })
    _samplingNodeDefsToCreate.push(samplingNodeDef)
  })
  return _samplingNodeDefsToCreate
}

export const SamplingNodeDef = {
  SAMPLING_NODE_DEF_BASE_UNIT_NAME,
  getNodeDefName,
  newNodeDef,
  newNodeDefs,
}
