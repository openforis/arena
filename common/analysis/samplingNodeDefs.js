import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/chain'

const PLOT_AREA_SUFFIX = '_plot_area_'
const WEIGHT_NODE_DEF_NAME = 'weight'
const SAMPLING_PLOT_AREA_NODE_DEF_NAME_REGEX = new RegExp(`^\\w+${PLOT_AREA_SUFFIX}$`)

const getEntityAreaNodeDefName = ({ nodeDefParent }) => `${NodeDef.getName(nodeDefParent)}${PLOT_AREA_SUFFIX}`

const isWeightNodeDef = (nodeDef) => WEIGHT_NODE_DEF_NAME === NodeDef.getName(nodeDef)

const isEntityAreaNodeDef = ({ nodeDef, nodeDefParent, includeOnlyValid = true }) => {
  if (!NodeDef.isSampling(nodeDef)) return false

  const name = NodeDef.getName(nodeDef)
  const isNestedEntityName = SAMPLING_PLOT_AREA_NODE_DEF_NAME_REGEX.test(name)

  return (
    (includeOnlyValid && name === getEntityAreaNodeDefName({ nodeDefParent })) ||
    (!includeOnlyValid && (isWeightNodeDef(nodeDef) || isNestedEntityName))
  )
}

const isBaseUnitEntityAreaNodeDef = ({ survey, chain, nodeDef }) => {
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return (
    NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef) && SamplingNodeDefs.isEntityAreaNodeDef({ nodeDef, nodeDefParent })
  )
}

const getAllEntityAreaNodeDefs = ({ survey, chain }) => {
  const samplingNodeDefs = Survey.getAnalysisNodeDefs({ chain, showSamplingNodeDefs: true })(survey)
  return samplingNodeDefs.filter((nodeDef) => {
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    return isWeightNodeDef(nodeDef) || isEntityAreaNodeDef({ nodeDef, nodeDefParent, includeOnlyValid: false })
  })
}

const getAreaNodeDefDefaultScript = ({ nodeDefParent, isWeight }) => {
  const name = isWeight ? WEIGHT_NODE_DEF_NAME : getEntityAreaNodeDefName({ nodeDefParent })
  const parentName = NodeDef.getName(nodeDefParent)
  const defaultValue = isWeight ? '1' : 'NA'
  return `${parentName}$${name} <- ${defaultValue}`
}

const newEntityAreaNodeDef = ({ nodeDefParent, baseUnitNodeDef, chainUuid, cycleKeys, isWeight = false }) => {
  const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
  const name = isWeight ? WEIGHT_NODE_DEF_NAME : getEntityAreaNodeDefName({ nodeDefParent })

  const props = {
    [NodeDef.propKeys.name]: name,
  }
  const script = getAreaNodeDefDefaultScript({ nodeDefParent, isWeight })

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

  const chainUuid = Chain.getUuid(chain)
  const cycleKeys = Survey.getCycleKeys(survey)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const descentants = Survey.getDescendantsAndSelf({ nodeDef: baseUnitNodeDef })(survey)
  const descendantEntities = descentants.filter(
    (descendantEntity) =>
      NodeDef.isEntity(descendantEntity) && (NodeDef.isMultiple(descendantEntity) || NodeDef.isRoot(descendantEntity))
  )

  const createAreaNodeDefIfNecessary = ({ existingNodeDef, nodeDefParent, isWeight }) => {
    if (existingNodeDef) {
      // weight def already existing
      validNodeDefsAlreadyExisting.push(existingNodeDef)
    } else {
      const newSamplingNodeDef = newEntityAreaNodeDef({
        nodeDefParent,
        baseUnitNodeDef,
        chainUuid,
        cycleKeys,
        isWeight,
      })
      nodeDefsToCreate.push(newSamplingNodeDef)
    }
  }

  descendantEntities.forEach((nodeDefParent) => {
    const childDefs = Survey.getNodeDefChildren(nodeDefParent, true)(survey)
    const existingEntityAreaNodeDef = childDefs.find((childDef) =>
      isEntityAreaNodeDef({ nodeDef: childDef, nodeDefParent })
    )
    const isBaseUnit = NodeDef.isEqual(nodeDefParent)(baseUnitNodeDef)
    const hasAreaBasedDef = childDefs.some(NodeDef.isAreaBasedEstimatedOf)

    if (hasAreaBasedDef || isBaseUnit) {
      if (isBaseUnit) {
        const existingNodeDef = childDefs.find(isWeightNodeDef)
        // create new weight node def only for base unit entity
        createAreaNodeDefIfNecessary({ existingNodeDef, nodeDefParent, isWeight: true })
      }
      if (hasAreaBasedDef) {
        // create new plot_area node def only if there is an area based node def
        createAreaNodeDefIfNecessary({ existingNodeDef: existingEntityAreaNodeDef, nodeDefParent, isWeight: false })
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
    if (isWeightNodeDef(samplingDef1)) return -1
    if (isWeightNodeDef(samplingDef2)) return 1
    if (isBaseUnitEntityAreaNodeDef({ survey, chain, nodeDef: samplingDef1 })) return -1
    if (isBaseUnitEntityAreaNodeDef({ survey, chain, nodeDef: samplingDef2 })) return 1
    return 0
  })

  return samplingDefs
}

export const SamplingNodeDefs = {
  getEntityAreaNodeDefName,
  isWeightNodeDef,
  isEntityAreaNodeDef,
  isBaseUnitEntityAreaNodeDef,
  determinePlotAreaNodeDefs,
  getSamplingDefsInEntities,
}
