import './processingChainView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as ProcessingChain from '@common/analysis/processingChain'

import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'
import CyclesSelect from '@webapp/loggedin/surveyViews/cyclesSelect/cyclesSelect'
import ProcessingChainButtonBar from '@webapp/loggedin/modules/analysis/processingChain/components/processingChainButtonBar'

import { getUrlParam } from '@webapp/utils/routerUtils'

import * as SurveyState from '@webapp/survey/surveyState'
import ProcessingChainSteps from './components/processingChainSteps'
import * as ProcessingChainState from './processingChainState'

import { navigateToProcessingChainsView, updateProcessingChainProp, resetProcessingChainState } from './actions'

const ProcessingChainView = props => {
  const {
    surveyInfo,
    surveyCycleKey,
    processingChain,
    history,
    navigateToProcessingChainsView,
    updateProcessingChainProp,
    resetProcessingChainState,
  } = props

  const i18n = useI18n()

  useEffect(() => {
    return () => {
      resetProcessingChainState()
    }
  }, [])

  useOnUpdate(() => {
    navigateToProcessingChainsView(history)
  }, [surveyCycleKey])

  return R.isEmpty(processingChain) ? null : (
    <div className="processing-chain">
      <div className="form">
        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingChain.getLabels(processingChain)}
          onChange={labels => updateProcessingChainProp(ProcessingChain.keysProps.labels, labels)}
        />

        <LabelsEditor
          formLabelKey="common.description"
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingChain.getDescriptions(processingChain)}
          onChange={descriptions => updateProcessingChainProp(ProcessingChain.keysProps.descriptions, descriptions)}
        />

        <CyclesSelect cyclesKeysSelected={[ProcessingChain.getCycle(processingChain)]} />

        <ProcessingChainSteps history={history} processingChain={processingChain} />
      </div>

      <ProcessingChainButtonBar />
    </div>
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  processingChain: ProcessingChainState.getProcessingChain(state),
})

export default connect(mapStateToProps, {
  navigateToProcessingChainsView,
  updateProcessingChainProp,
  resetProcessingChainState,
})(ProcessingChainView)
