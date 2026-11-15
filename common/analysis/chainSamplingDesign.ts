import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'

export interface SamplingDesign {
  areaWeightingMethod?: boolean
  baseUnitNodeDefUuid?: string
  clusteringNodeDefUuid?: string
  phase1CategoryUuid?: string
  phase1JoinAttribute?: string
  phase2AsSamplingPointData?: boolean
  phase2JoinAttribute?: string
  phase2JoinEntityUuid?: string
  postStratificationAttributeDefUuid?: string
  reportingDataCategoryUuid?: string
  reportingDataAttributeDefsByLevelUuid?: Record<string, string>
  samplingStrategy?: string
  stratumNodeDefUuid?: string
}

type SamplingDesignUpdater = (samplingDesign: SamplingDesign) => SamplingDesign

const keysProps = {
  areaWeightingMethod: 'areaWeightingMethod',
  baseUnitNodeDefUuid: 'baseUnitNodeDefUuid',
  clusteringNodeDefUuid: 'clusteringNodeDefUuid',
  phase1CategoryUuid: 'phase1CategoryUuid',
  phase1JoinAttribute: 'phase1JoinAttribute',
  phase2AsSamplingPointData: 'phase2AsSamplingPointData',
  phase2JoinAttribute: 'phase2JoinAttribute',
  phase2JoinEntityUuid: 'phase2JoinEntityUuid',
  postStratificationAttributeDefUuid: 'postStratificationAttributeDefUuid',
  reportingDataCategoryUuid: 'reportingDataCategoryUuid',
  reportingDataAttributeDefsByLevelUuid: 'reportingDataAttributeDefsByLevelUuid',
  samplingStrategy: 'samplingStrategy',
  stratumNodeDefUuid: 'stratumNodeDefUuid',
} as const

// name of the built-in "code" column of a category, always available as join attribute
const categoryCodeAttributeName = 'code'

const samplingStrategies = {
  simpleRandom: 'simpleRandom',
  systematic: 'systematic',
  stratifiedRandom: 'stratifiedRandom',
  stratifiedSystematic: 'stratifiedSystematic',
  twoPhase: 'twoPhase',
  // doublePhase: 'doublePhase'
}

const isPropTrue =
  (prop: keyof SamplingDesign) =>
  (samplingDesign: SamplingDesign | null | undefined): boolean =>
    samplingDesign?.[prop] === true

// null-tolerant getter of a string prop
const getStringProp =
  (prop: keyof SamplingDesign) =>
  (samplingDesign: SamplingDesign | null | undefined): string | undefined =>
    A.prop(prop)(samplingDesign)

const isAreaWeightingMethod = isPropTrue(keysProps.areaWeightingMethod)
const getBaseUnitNodeDefUuid = getStringProp(keysProps.baseUnitNodeDefUuid)
const getClusteringNodeDefUuid = getStringProp(keysProps.clusteringNodeDefUuid)
const getPhase1CategoryUuid = getStringProp(keysProps.phase1CategoryUuid)
const getPhase1JoinAttribute = getStringProp(keysProps.phase1JoinAttribute)
const isPhase2AsSamplingPointData = isPropTrue(keysProps.phase2AsSamplingPointData)
const getPhase2JoinAttribute = getStringProp(keysProps.phase2JoinAttribute)
const getPhase2JoinEntityUuid = getStringProp(keysProps.phase2JoinEntityUuid)
const getPostStratificationAttributeDefUuid = getStringProp(keysProps.postStratificationAttributeDefUuid)
const getReportingDataCategoryUuid = getStringProp(keysProps.reportingDataCategoryUuid)
const getReportingDataAttributeDefUuid =
  ({ categoryLevelUuid }: { categoryLevelUuid: string }) =>
  (samplingDesign: SamplingDesign): string | undefined =>
    Objects.path([keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid])(samplingDesign)
const getSamplingStrategy = getStringProp(keysProps.samplingStrategy)
const getStratumNodeDefUuid = getStringProp(keysProps.stratumNodeDefUuid)

// CHECK
const isPostStratificationEnabled = (samplingDesign: SamplingDesign): boolean =>
  Boolean(getSamplingStrategy(samplingDesign))

const isStratificationEnabled = (samplingDesign: SamplingDesign): boolean => {
  const samplingStrategy = getSamplingStrategy(samplingDesign)
  return (
    Boolean(samplingStrategy) &&
    ![samplingStrategies.simpleRandom, samplingStrategies.systematic].includes(samplingStrategy)
  )
}

// stratification must always be specified (no sampling strategy supports unstratified sampling units)
const isStratificationNotSpecifiedAllowed = (): boolean => false

const isPhase1CategorySelectionEnabled = (samplingDesign: SamplingDesign): boolean =>
  getSamplingStrategy(samplingDesign) === samplingStrategies.twoPhase

const isPhase2JoinEntitySelectionEnabled = isPhase1CategorySelectionEnabled

const isPhase2AsSamplingPointDataSelectionEnabled = isPhase1CategorySelectionEnabled

const isPhase1JoinAttributeSelectionEnabled = (samplingDesign: SamplingDesign): boolean =>
  isPhase1CategorySelectionEnabled(samplingDesign) && !isPhase2AsSamplingPointData(samplingDesign)

const isPhase2JoinAttributeSelectionEnabled = isPhase1JoinAttributeSelectionEnabled

// UPDATE

const dissocProp =
  (prop: keyof SamplingDesign): SamplingDesignUpdater =>
  (samplingDesign) =>
    A.dissoc(prop)(samplingDesign)

const assocProp =
  (prop: keyof SamplingDesign, value: unknown): SamplingDesignUpdater =>
  (samplingDesign) =>
    A.assoc(prop, value)(samplingDesign)

const dissocPhase1CategoryUuid = dissocProp(keysProps.phase1CategoryUuid)
const dissocPhase1JoinAttribute = dissocProp(keysProps.phase1JoinAttribute)
const dissocPhase2AsSamplingPointData = dissocProp(keysProps.phase2AsSamplingPointData)
const dissocPhase2JoinAttribute = dissocProp(keysProps.phase2JoinAttribute)
const dissocPhase2JoinEntityUuid = dissocProp(keysProps.phase2JoinEntityUuid)
const dissocPostStratificationAttributeDefUuid = dissocProp(keysProps.postStratificationAttributeDefUuid)
const dissocStratumNodeDefUuid = dissocProp(keysProps.stratumNodeDefUuid)
const dissocReportingDataAttributeDefsByLevelUuid = dissocProp(keysProps.reportingDataAttributeDefsByLevelUuid)

const cleanupSamplingDesign = (samplingDesign: SamplingDesign): SamplingDesign => {
  let samplingDesignUpdated = samplingDesign
  if (getPostStratificationAttributeDefUuid(samplingDesignUpdated) === getStratumNodeDefUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPostStratificationAttributeDefUuid(samplingDesignUpdated)
  }
  if (!isStratificationEnabled(samplingDesignUpdated) && getStratumNodeDefUuid(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocStratumNodeDefUuid(samplingDesignUpdated)
  }
  if (
    !isPostStratificationEnabled(samplingDesignUpdated) &&
    getPostStratificationAttributeDefUuid(samplingDesignUpdated)
  ) {
    samplingDesignUpdated = dissocPostStratificationAttributeDefUuid(samplingDesignUpdated)
  }
  if (!isPhase1CategorySelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase1CategoryUuid(samplingDesignUpdated)
  }
  if (!isPhase2JoinEntitySelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2JoinEntityUuid(samplingDesignUpdated)
  }
  if (!isPhase2AsSamplingPointDataSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2AsSamplingPointData(samplingDesignUpdated)
  }
  if (!isPhase1JoinAttributeSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase1JoinAttribute(samplingDesignUpdated)
  }
  if (!isPhase2JoinAttributeSelectionEnabled(samplingDesignUpdated)) {
    samplingDesignUpdated = dissocPhase2JoinAttribute(samplingDesignUpdated)
  }
  return samplingDesignUpdated
}

const assocBaseUnitNodeDefUuid = (baseUnitNodeDefUuid: string | null) =>
  assocProp(keysProps.baseUnitNodeDefUuid, baseUnitNodeDefUuid)

const assocAreaWeightingMethod = (areaWeightingMethod: boolean) =>
  assocProp(keysProps.areaWeightingMethod, areaWeightingMethod)

const assocClusteringNodeDefUuid = (clusteringNodeDefUuid: string | null) =>
  assocProp(keysProps.clusteringNodeDefUuid, clusteringNodeDefUuid)

const assocPhase1CategoryUuid =
  (phase1CategoryUuid: string | null): SamplingDesignUpdater =>
  (samplingDesign) =>
    assocProp(keysProps.phase1CategoryUuid, phase1CategoryUuid)(dissocPhase1JoinAttribute(samplingDesign))

const assocPhase1JoinAttribute = (phase1JoinAttribute: string | null) =>
  assocProp(keysProps.phase1JoinAttribute, phase1JoinAttribute)

const assocPhase2JoinEntityUuid =
  (phase2JoinEntityUuid: string | null): SamplingDesignUpdater =>
  (samplingDesign) =>
    assocProp(keysProps.phase2JoinEntityUuid, phase2JoinEntityUuid)(dissocPhase2JoinAttribute(samplingDesign))

const assocPhase2AsSamplingPointData =
  (phase2AsSamplingPointData: boolean): SamplingDesignUpdater =>
  (samplingDesign) =>
    cleanupSamplingDesign(assocProp(keysProps.phase2AsSamplingPointData, phase2AsSamplingPointData)(samplingDesign))

const assocPhase2JoinAttribute = (phase2JoinAttribute: string | null) =>
  assocProp(keysProps.phase2JoinAttribute, phase2JoinAttribute)

const assocPostStratificationAttributeDefUuid = (postStratificationAttributeDefUuid: string | null) =>
  assocProp(keysProps.postStratificationAttributeDefUuid, postStratificationAttributeDefUuid)

const assocStratumNodeDefUuid =
  (stratumNodeDefUuid: string | null): SamplingDesignUpdater =>
  (samplingDesign) =>
    cleanupSamplingDesign(assocProp(keysProps.stratumNodeDefUuid, stratumNodeDefUuid)(samplingDesign))

const assocSamplingStrategy =
  (samplingStrategy: string | null): SamplingDesignUpdater =>
  (samplingDesign) =>
    cleanupSamplingDesign(assocProp(keysProps.samplingStrategy, samplingStrategy)(samplingDesign))

const assocReportingDataCategoryUuid =
  (reportingDataCategoryUuid: string | null): SamplingDesignUpdater =>
  (samplingDesign) =>
    assocProp(
      keysProps.reportingDataCategoryUuid,
      reportingDataCategoryUuid
    )(dissocReportingDataAttributeDefsByLevelUuid(samplingDesign))

const assocReportingDataAttributeDefUuid =
  ({
    categoryLevelUuid,
    nodeDefUuid,
  }: {
    categoryLevelUuid: string
    nodeDefUuid: string | null
  }): SamplingDesignUpdater =>
  (samplingDesign) =>
    Objects.assocPath({
      obj: samplingDesign,
      path: [keysProps.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid],
      value: nodeDefUuid,
    })

export const ChainSamplingDesign = {
  categoryCodeAttributeName,
  keysProps,
  samplingStrategies,

  // READ
  getBaseUnitNodeDefUuid,
  isAreaWeightingMethod,
  getClusteringNodeDefUuid,
  getPhase1CategoryUuid,
  getPhase1JoinAttribute,
  isPhase2AsSamplingPointData,
  getPhase2JoinAttribute,
  getPhase2JoinEntityUuid,
  isPostStratificationEnabled,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
  isPhase1CategorySelectionEnabled,
  isPhase1JoinAttributeSelectionEnabled,
  isPhase2AsSamplingPointDataSelectionEnabled,
  isPhase2JoinAttributeSelectionEnabled,
  isPhase2JoinEntitySelectionEnabled,
  isStratificationEnabled,
  isStratificationNotSpecifiedAllowed,
  getPostStratificationAttributeDefUuid,
  getSamplingStrategy,
  getStratumNodeDefUuid,

  // UPDATE
  assocAreaWeightingMethod,
  assocBaseUnitNodeDefUuid,
  assocClusteringNodeDefUuid,
  assocPhase1CategoryUuid,
  assocPhase1JoinAttribute,
  assocPhase2AsSamplingPointData,
  assocPhase2JoinAttribute,
  assocPhase2JoinEntityUuid,
  assocPostStratificationAttributeDefUuid,
  assocReportingDataCategoryUuid,
  assocReportingDataAttributeDefUuid,
  assocSamplingStrategy,
  assocStratumNodeDefUuid,
}
