import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { getUrlParam } from '@webapp/utils/routerUtils'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { fetchProcessingStep, resetProcessingStepState } from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    processingStepUuid, processingStep,
    fetchProcessingStep, resetProcessingStepState
  } = props

  useEffect(() => {
    fetchProcessingStep(processingStepUuid)

    return () => {
      resetProcessingStepState()
    }
  }, [])

  return R.isEmpty(processingStep)
    ? null
    : (
      <div>{ProcessingStep.getUuid(processingStep)}</div>
    )
}

const mapStateToProps = (state, { match }) => ({
  processingStepUuid: getUrlParam('processingStepUuid')(match),
  processingStep: ProcessingStepState.getProcessingStep(state)
})

export default connect(mapStateToProps, { fetchProcessingStep, resetProcessingStepState })(ProcessingStepView)