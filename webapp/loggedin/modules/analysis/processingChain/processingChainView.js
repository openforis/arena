import './processingChainView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { useParams } from 'react-router'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as ProcessingChain from '@common/analysis/processingChain'

import { useOnUpdate } from '@webapp/commonComponents/hooks'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'
import CyclesSelect from '@webapp/loggedin/surveyViews/cyclesSelect/cyclesSelect'
import ProcessingChainButtonBar from '@webapp/loggedin/modules/analysis/processingChain/components/processingChainButtonBar'
import ProcessingStepView from '@webapp/loggedin/modules/analysis/processingStep/processingStepView'

import * as SurveyState from '@webapp/survey/surveyState'
import ProcessingChainSteps from './components/processingChainSteps'
import * as ProcessingChainState from './processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { navigateToProcessingChainsView, updateProcessingChainProp, resetProcessingChainState } from './actions'
import { fetchProcessingChain } from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainView = props => {
  const {
    surveyInfo,
    surveyCycleKey,
    processingChain,
    isEditingStep,
    history,
    fetchProcessingChain,
    navigateToProcessingChainsView,
    updateProcessingChainProp,
    resetProcessingChainState,
  } = props

  const { processingChainUuid } = useParams()
  useEffect(() => {
    if (R.isEmpty(processingChain)) {
      fetchProcessingChain(processingChainUuid)
    }

    return () => {
      resetProcessingChainState()
    }
  }, [])

  useOnUpdate(() => {
    navigateToProcessingChainsView(history)
  }, [surveyCycleKey])

  return R.isEmpty(processingChain) ? null : (
    <div className={`processing-chain${isEditingStep ? ' step-editor-open' : ''}`}>
      <div className="form">
        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingChain.getLabels(processingChain)}
          showFormLabel={!isEditingStep}
          onChange={labels => updateProcessingChainProp(ProcessingChain.keysProps.labels, labels)}
        />

        {!isEditingStep && (
          <>
            <LabelsEditor
              formLabelKey="common.description"
              languages={Survey.getLanguages(surveyInfo)}
              labels={ProcessingChain.getDescriptions(processingChain)}
              onChange={descriptions => updateProcessingChainProp(ProcessingChain.keysProps.descriptions, descriptions)}
            />
            <CyclesSelect cyclesKeysSelected={[ProcessingChain.getCycle(processingChain)]} />
          </>
        )}

        <ProcessingChainSteps processingChain={processingChain} />

        {isEditingStep && <ProcessingStepView />}
      </div>

      <ProcessingChainButtonBar />
    </div>
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  processingChain: ProcessingChainState.getProcessingChain(state),
  isEditingStep: ProcessingStepState.isEditingStep(state),
})

export default connect(mapStateToProps, {
  fetchProcessingChain,
  navigateToProcessingChainsView,
  updateProcessingChainProp,
  resetProcessingChainState,
})(ProcessingChainView)
