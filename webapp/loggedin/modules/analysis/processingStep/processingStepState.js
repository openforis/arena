import * as R from 'ramda'

import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'

export const stateKey = 'processingStep'

export const getProcessingStep = R.pipe(
  AnalysisState.getState,
  R.prop(stateKey)
)
