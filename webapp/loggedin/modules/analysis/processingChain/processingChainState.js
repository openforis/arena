import * as R from 'ramda'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingChain'

export const getProcessingChain = R.pipe(AnalysisState.getState, R.prop(stateKey))
