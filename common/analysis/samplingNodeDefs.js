import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'

const PLOT_AREA_SUFFIX = '_plot_area_'
const SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME = 'weight'
const SAMPLING_PLOT_AREA_NODE_DEF_NAME_REGEX = new RegExp(`^\\w+${PLOT_AREA_SUFFIX}$`)

const getEntityAreaNodeDefName = ({ nodeDefParent, baseUnitNodeDef }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  return isBaseUnit
    ? SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME
    : `${NodeDef.getName(nodeDefParent)}${PLOT_AREA_SUFFIX}`
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

const isBaseUnitEntityAreaNodeDef = ({ survey, chain, nodeDef }) => {
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return (
    NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef) &&
    SamplingNodeDefs.isEntityAreaNodeDef({ nodeDef, nodeDefParent, baseUnitNodeDef })
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

const getEntityAreaNodeDefDefaultScript = ({ nodeDefParent, baseUnitNodeDef }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  const name = getEntityAreaNodeDefName({ nodeDefParent, baseUnitNodeDef })
  const parentName = NodeDef.getName(nodeDefParent)
  const defaultValue = isBaseUnit ? '1' : 'NA'
  return `${parentName}$${name} <- ${defaultValue}`
}

const newEntityAreaNodeDef = ({ nodeDefParent, baseUnitNodeDef, chainUuid, cycleKeys }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  const name = getEntityAreaNodeDefName({ nodeDefParent, baseUnitNodeDef })

  const props = {
    [NodeDef.propKeys.name]: name,
  }
  const script = getEntityAreaNodeDefDefaultScript({ nodeDefParent, baseUnitNodeDef })

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

const determinePlotAreaNodeDefs = ({ survey, chain }) => {
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

    if (hasAreaBasedDef || NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)) {
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

const getSamplingDefsInEntities = ({ survey, chain, entities, analysisNodeDefs }) => {
  const entityUuids = entities.map(NodeDef.getUuid)

  const samplingDefs = analysisNodeDefs.filter(
    (analysisNodeDef) =>
      NodeDef.isSampling(analysisNodeDef) && entityUuids.includes(NodeDef.getParentUuid(analysisNodeDef))
  )

  // put the "weight" node def first
  samplingDefs.sort((samplingDef1, samplingDef2) => {
    if (isBaseUnitEntityAreaNodeDef({ survey, chain, nodeDef: samplingDef1 })) {
      return -1
    }
    if (isBaseUnitEntityAreaNodeDef({ survey, chain, nodeDef: samplingDef2 })) {
      return 1
    }
    return 0
  })

  return samplingDefs
}

export const SamplingNodeDefs = {
  SAMPLING_NODE_DEF_BASE_UNIT_NAME: SAMPLING_PLOT_AREA_NODE_DEF_BASE_UNIT_NAME,
  getEntityAreaNodeDefName,
  isEntityAreaNodeDef,
  isBaseUnitEntityAreaNodeDef,
  determinePlotAreaNodeDefs,
  getSamplingDefsInEntities,
}
