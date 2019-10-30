import './processingStepView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { getUrlParam } from '@webapp/utils/routerUtils'

import EntitySelector from './components/entitySelector'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import {
  fetchProcessingStep,
  resetProcessingStepState,
  putProcessingStepProps
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    processingStepUuid, processingStep,
    fetchProcessingStep, resetProcessingStepState, putProcessingStepProps
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
      <div className="processing-step">
        <div className="form">

          <EntitySelector
            processingStep={processingStep}
            onChange={entityUuid => {
              const props = {
                [ProcessingStep.keysProps.entityUuid]: entityUuid,
                [ProcessingStep.keysProps.categoryUuid]: null,
              }
              putProcessingStepProps(props)
            }}
          />

        </div>
      </div>
    )
}

const mapStateToProps = (state, { match }) => ({
  processingStepUuid: getUrlParam('processingStepUuid')(match),
  processingStep: ProcessingStepState.getProcessingStep(state)
})

export default connect(
  mapStateToProps,
  { fetchProcessingStep, resetProcessingStepState, putProcessingStepProps }
)(ProcessingStepView)