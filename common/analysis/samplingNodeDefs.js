import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'

const SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME = 'weight'
const SAMPLING_PLOT_AREA_NODE_DEF_NAME_REGEX = /_\w+_plot_area/

const getEntityAreaNodeDefName = ({ nodeDefParent, baseUnitNodeDef }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  return isBaseUnit ? SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME : `_${NodeDef.getName(nodeDefParent)}_plot_area`
}

const isEntityAreaNodeDef = ({ nodeDef, nodeDefParent, baseUnitNodeDef, includeOnlyValid = true }) => {
  if (!NodeDef.isSampling(nodeDef)) return false

  const name = NodeDef.getName(nodeDef)
  const isBaseUnitName = name === SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME
  const isNestedEntityName = SAMPLING_PLOT_AREA_NODE_DEF_NAME_REGEX.test(name)

  return (
    (includeOnlyValid && name === getEntityAreaNodeDefName({ nodeDefParent, baseUnitNodeDef })) ||
    (!includeOnlyValid && (isBaseUnitName || isNestedEntityName))
  )
}

const getAllEntityAreaNodeDefs = ({ survey, chain }) => {
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const samplingNodeDefs = Survey.getAnalysisNodeDefs({ chain, showSamplingNodeDefs: true })(survey)
  return samplingNodeDefs.filter((nodeDef) => {
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    return isEntityAreaNodeDef({ nodeDef, nodeDefParent, baseUnitNodeDef, includeOnlyValid: false })
  })
}

const newEntityAreaNodeDef = ({ nodeDefParent, baseUnitNodeDef, chainUuid, cycleKeys }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  const name = getEntityAreaNodeDefName({ nodeDefParent, baseUnitNodeDef })

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

const determineSamplingNodeDefs = ({ survey, chain }) => {
  const nodeDefsToCreate = []
  const nodeDefsToDelete = []
  const validNodeDefsAlreadyExisting = []

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const descentants = Survey.getDescendantsAndSelf({ nodeDef: baseUnitNodeDef })(survey)
  const descendantEntities = descentants.filter(
    (descendantEntity) =>
      NodeDef.isEntity(descendantEntity) && (NodeDef.isMultiple(descendantEntity) || NodeDef.isRoot(descendantEntity))
  )

  descendantEntities.forEach((nodeDefParent) => {
    const childDefs = Survey.getNodeDefChildren(nodeDefParent, true)(survey)
    const existingEntityAreaNodeDef = childDefs.find((childDef) =>
      isEntityAreaNodeDef({ nodeDef: childDef, nodeDefParent, baseUnitNodeDef })
    )
    const hasAreaBasedDef = childDefs.some((childDef) => NodeDef.isAreaBasedEstimatedOf(childDef))

    if (hasAreaBasedDef) {
      if (existingEntityAreaNodeDef) {
        // entity area node def already existing
        validNodeDefsAlreadyExisting.push(existingEntityAreaNodeDef)
      } else {
        // create new entity area node def
        const newSamplingNodeDef = newEntityAreaNodeDef({
          nodeDefParent,
          baseUnitNodeDef,
          chainUuid: Chain.getUuid(chain),
          cycleKeys: Survey.getCycleKeys(survey),
        })
        nodeDefsToCreate.push(newSamplingNodeDef)
      }
    } else if (existingEntityAreaNodeDef) {
      // delete entity area node defs when entity doesn't have any area based node def
      nodeDefsToDelete.push(existingEntityAreaNodeDef)
    }
  })

  // check if some existing entity area node def is not valid anymore and must be deleted
  const existingEntityAreaNodeDefs = getAllEntityAreaNodeDefs({ survey, chain })
  const validNodeDefsAlreadyExistingUuids = validNodeDefsAlreadyExisting.map(NodeDef.getUuid)
  const existingEntityAreaNodeDefsToDelete = existingEntityAreaNodeDefs.filter(
    (existingSamplingNodeDef) => !validNodeDefsAlreadyExistingUuids.includes(NodeDef.getUuid(existingSamplingNodeDef))
  )

  nodeDefsToDelete.push(...existingEntityAreaNodeDefsToDelete)

  return { nodeDefsToCreate, nodeDefsToDelete }
}

export const SamplingNodeDefs = {
  SAMPLING_NODE_DEF_BASE_UNIT_NAME: SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME,
  getEntityAreaNodeDefName,
  determineSamplingNodeDefs,
}
