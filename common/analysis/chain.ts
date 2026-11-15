import { Dates } from '@openforis/arena-core'
import type { Chain as ArenaChain } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

import { ChainSamplingDesign, SamplingDesign } from './chainSamplingDesign'
import { ChainStatisticalAnalysis, StatisticalAnalysis } from './chainStatisticalAnalysis'

type ChainUpdater = (chain: ArenaChain) => ArenaChain
type ChainGetter<T> = (chain: ArenaChain) => T
type ChainPredicate = ChainGetter<boolean>

export const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'statusExec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
  validation: Validation.keys.validation,
  scriptCommon: 'scriptCommon',
  scriptEnd: 'scriptEnd',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  hasSamplingDesign: 'hasSamplingDesign',
  samplingDesign: 'samplingDesign',
  analysisNodeDefs: 'analysisNodeDefs',
  submitOnlyAnalysisStepDataIntoR: 'submitOnlyAnalysisStepDataIntoR',
  submitOnlySelectedRecordsIntoR: 'submitOnlySelectedRecordsIntoR',
  selectedRecordUuids: 'selectedRecordUuids',
  statisticalAnalysis: 'statisticalAnalysis',
  resultsBackFromRStudio: 'resultsBackFromRStudio',
  includeEntitiesWithoutData: 'includeEntitiesWithoutData',
}

export const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

// ====== READ

export const {
  getUuid,
  getProps,
  getPropsDiff,
  getDateCreated,
  getDateModified,
  getDescriptions,
  getDescription,
  getLabels,
  getLabel,
  isTemporary,
} = ObjectUtils
export const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted) as ChainGetter<Date | null>
export const getStatusExec: ChainGetter<string | null> = A.propOr(null, keys.statusExec)
export const getScriptCommon: ChainGetter<string | null> = A.propOr(null, keys.scriptCommon)
export const getScriptEnd: ChainGetter<string | null> = A.propOr(null, keys.scriptEnd)
export const hasSamplingDesign: ChainPredicate = ObjectUtils.isPropTrue(keysProps.hasSamplingDesign)
export const isSubmitOnlyAnalysisStepDataIntoR: ChainPredicate = ObjectUtils.isPropTrue(
  keysProps.submitOnlyAnalysisStepDataIntoR
)
export const isSubmitOnlySelectedRecordsIntoR: ChainPredicate = ObjectUtils.isPropTrue(
  keysProps.submitOnlySelectedRecordsIntoR
)
export const getSelectedRecordUuids: ChainGetter<string[]> = ObjectUtils.getProp(keysProps.selectedRecordUuids, [])
export const getSamplingDesign: ChainGetter<SamplingDesign> = ObjectUtils.getProp(keysProps.samplingDesign, {})
export const getStatisticalAnalysis: ChainGetter<StatisticalAnalysis> = ObjectUtils.getProp(
  keysProps.statisticalAnalysis,
  {}
)
export const isResultsBackFromRStudio: ChainPredicate = ObjectUtils.getProp(keysProps.resultsBackFromRStudio, true)
export const isIncludeEntitiesWithoutData: ChainPredicate = ObjectUtils.getProp(
  keysProps.includeEntitiesWithoutData,
  false
)

// ====== UPDATE
export const assocHasSamplingDesign = (value: boolean) => ObjectUtils.setProp(keysProps.hasSamplingDesign, value)

export const assocSubmitOnlyAnalysisStepDataIntoR = (value: boolean) =>
  ObjectUtils.setProp(keysProps.submitOnlyAnalysisStepDataIntoR, value)

export const assocSubmitOnlySelectedRecordsIntoR =
  (value: boolean): ChainUpdater =>
  (chain) => {
    let chainUpdated = ObjectUtils.setProp(keysProps.submitOnlySelectedRecordsIntoR, value)(chain)
    if (!value) {
      chainUpdated = ObjectUtils.dissocProp(keysProps.selectedRecordUuids)(chainUpdated)
    }
    return chainUpdated
  }

export const assocSelectedRecordUuids = (selectedRecordUuids: string[]) =>
  ObjectUtils.setProp(keysProps.selectedRecordUuids, selectedRecordUuids)

export const assocResultsBackFromRStudio = (value: boolean) =>
  ObjectUtils.setProp(keysProps.resultsBackFromRStudio, value)

export const assocIncludeEntitiesWithoutData = (value: boolean) =>
  ObjectUtils.setProp(keysProps.includeEntitiesWithoutData, value)

const assocSamplingDesign = (value: SamplingDesign) => ObjectUtils.setProp(keysProps.samplingDesign, value)

export const updateSamplingDesign =
  (updateFn: (samplingDesign: SamplingDesign) => SamplingDesign): ChainUpdater =>
  (chain) => {
    const samplingDesign = getSamplingDesign(chain)
    const samplingDesignUpdated = updateFn(samplingDesign)
    let chainUpdated = assocSamplingDesign(samplingDesignUpdated)(chain)
    if (
      !ChainSamplingDesign.getSamplingStrategy(samplingDesignUpdated) &&
      ChainStatisticalAnalysis.getPValue(getStatisticalAnalysis(chainUpdated))
    ) {
      chainUpdated = updateStatisticalAnalysis(ChainStatisticalAnalysis.resetPValue)(chainUpdated)
    }
    if (
      !ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) &&
      ChainStatisticalAnalysis.isClusteringOnlyVariances(getStatisticalAnalysis(chainUpdated))
    ) {
      chainUpdated = updateStatisticalAnalysis(ChainStatisticalAnalysis.assocClusteringOnlyVariances(false))(
        chainUpdated
      )
    }
    return chainUpdated
  }

const assocStatisticalAnalysis = (value: StatisticalAnalysis) =>
  ObjectUtils.setProp(keysProps.statisticalAnalysis, value)

export const updateStatisticalAnalysis =
  (updateFn: (statisticalAnalysis: StatisticalAnalysis) => StatisticalAnalysis): ChainUpdater =>
  (chain) => {
    const statisticalAnalysis = getStatisticalAnalysis(chain)
    const getStatisticalAnalysisUpdated = updateFn(statisticalAnalysis)
    return assocStatisticalAnalysis(getStatisticalAnalysisUpdated)(chain)
  }

// ====== CHECK
export const isDraft = (chain: ArenaChain): boolean => {
  const dateExecuted = getDateExecuted(chain)
  return A.isNil(dateExecuted) || Dates.isAfter(getDateModified(chain) as Date, dateExecuted)
}

export const checkChangeRequiresSurveyPublish = ({
  chainPrev,
  chainNext,
}: {
  chainPrev: ArenaChain
  chainNext: ArenaChain
}): boolean => {
  const samplingDesignPrev = getSamplingDesign(chainPrev)
  const samplingDesignNext = getSamplingDesign(chainNext)
  return (
    ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesignPrev) !==
    ChainSamplingDesign.getBaseUnitNodeDefUuid(samplingDesignNext)
  )
}

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation, hasValidation, assocValidation, dissocValidation } = Validation

export const getItemValidationByUuid = (uuid: string) => A.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation =
  (uuid: string, validation: Validation.ValidationInstance): ChainUpdater =>
  (chain) => {
    const validationUpdated = Validation.assocFieldValidation(uuid, validation)(getValidation(chain))
    return { ...chain, validation: validationUpdated }
  }
