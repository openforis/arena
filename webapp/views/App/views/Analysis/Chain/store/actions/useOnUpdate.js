import * as Chain from '@common/analysis/processingChain'
import { AnalysisActions } from '@webapp/service/storage'

export const useOnUpdate = ({ chain, setChain, setDirty }) => ({ name, value }) => {
  const chainUpdated = Chain.assocProp(name, value)(chain)
  setDirty(true)
  setChain(chainUpdated)
  AnalysisActions.persistChain({ chain })
}
