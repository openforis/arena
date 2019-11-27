import './processingChainView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as ProcessingChain from '@common/analysis/processingChain'

import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import { getUrlParam } from '@webapp/utils/routerUtils'

import * as SurveyState from '@webapp/survey/surveyState'
import ProcessingChainSteps from './components/processingChainSteps'
import * as ProcessingChainState from './processingChainState'

import {
  fetchProcessingChain,
  navigateToProcessingChainsView,
  putProcessingChainProp,
  deleteProcessingChain,
  resetProcessingChainState,
} from './actions'

const ProcessingChainView = props => {
  const {
    surveyInfo,
    surveyCycleKey,
    processingChainUuid,
    processingChain,
    history,
    fetchProcessingChain,
    navigateToProcessingChainsView,
    putProcessingChainProp,
    deleteProcessingChain,
    resetProcessingChainState,
  } = props

  const i18n = useI18n()

  useEffect(() => {
    fetchProcessingChain(processingChainUuid)

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
          onChange={labels =>
            putProcessingChainProp(ProcessingChain.keysProps.labels, labels)
          }
        />

        <LabelsEditor
          formLabelKey="common.description"
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingChain.getDescriptions(processingChain)}
          onChange={descriptions =>
            putProcessingChainProp(
              ProcessingChain.keysProps.descriptions,
              descriptions,
            )
          }
        />

        <ProcessingChainSteps
          history={history}
          processingChain={processingChain}
        />

        <button
          className="btn-s btn-danger btn-delete"
          onClick={() =>
            window.confirm(i18n.t('processingChainView.deleteConfirm')) &&
            deleteProcessingChain(history)
          }
        >
          <span className="icon icon-bin icon-12px icon-left" />
          {i18n.t('common.delete')}
        </button>
      </div>
    </div>
  )
}

const mapStateToProps = (state, { match }) => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  processingChainUuid: getUrlParam('processingChainUuid')(match),
  processingChain: ProcessingChainState.getProcessingChain(state),
})

export default connect(mapStateToProps, {
  fetchProcessingChain,
  navigateToProcessingChainsView,
  putProcessingChainProp,
  deleteProcessingChain,
  resetProcessingChainState,
})(ProcessingChainView)
