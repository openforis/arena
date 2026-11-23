import * as Chain from '@common/analysis/chain'

import * as RecordStep from '@core/record/recordStep'

const getChainState = (state) => state.ui.chain

const getChain = (state) => {
  const chainState = getChainState(state)
  return chainState.chain
}

const getRecordsCountByStep = (state) => {
  const chainState = getChainState(state)
  return chainState.recordsCountByStep
}

const hasRecordsToProcess = (state) => {
  const chain = getChain(state)
  const recordsCountByStep = getRecordsCountByStep(state)
  const totalRecords = Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)
    ? Number(recordsCountByStep[RecordStep.analysisCode]) || 0
    : RecordStep.steps.reduce((acc, step) => {
        const count = Number(recordsCountByStep[step.id]) || 0
        return acc + count
      }, 0)
  return totalRecords > 0
}

const isChainEditLocked = (state) => {
  const chainState = getChainState(state)
  return Boolean(chainState.chainEditLocked)
}

export const ChainState = {
  getChain,
  getRecordsCountByStep,
  hasRecordsToProcess,
  isChainEditLocked,
}
