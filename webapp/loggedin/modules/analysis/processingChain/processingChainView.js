import './processingChainView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../core/survey/survey'
import ProcessingChain from '../../../../../common/analysis/processingChain'

import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'

import { getUrlParam } from '../../../../utils/routerUtils'
import { useI18n, useOnUpdate } from '../../../../commonComponents/hooks'

import * as SurveyState from '../../../../survey/surveyState'
import * as ProcessingChainState from './processingChainState'

import {
  fetchProcessingChain,
  navigateToProcessingChainsView,
  putProcessingChainProp,
  deleteProcessingChain
} from './actions'

const ProcessingChainView = props => {

  const {
    surveyInfo, surveyCycleKey,
    processingChainUuid, processingChain,
    history,
    fetchProcessingChain, navigateToProcessingChainsView, putProcessingChainProp, deleteProcessingChain,
  } = props

  const i18n = useI18n()

  useEffect(() => {
    fetchProcessingChain(processingChainUuid)
  }, [])

  useOnUpdate(() => {
    navigateToProcessingChainsView(history)
  }, [surveyCycleKey])

  return processingChain
    ? (
      <div className="processing-chain">
        <div className="form">

          <LabelsEditor
            languages={Survey.getLanguages(surveyInfo)}
            labels={ProcessingChain.getLabels(processingChain)}
            onChange={labels => putProcessingChainProp(ProcessingChain.keysProps.labels, labels)}
          />

          <LabelsEditor
            formLabelKey="common.description"
            languages={Survey.getLanguages(surveyInfo)}
            labels={ProcessingChain.getDescriptions(processingChain)}
            onChange={descriptions => putProcessingChainProp(ProcessingChain.keysProps.descriptions, descriptions)}
          />
        </div>

        <button className="btn-s btn-danger btn-delete"
                onClick={() => window.confirm(i18n.t('analysis.processingChain.deleteConfirm')) &&
                  deleteProcessingChain(history)}>
          <span className="icon icon-bin icon-12px icon-left"/>
          {i18n.t('common.delete')}
        </button>
      </div>
    )
    : null
}

const mapStateToProps = (state, { match }) => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  processingChainUuid: getUrlParam('processingChainUuid')(match),
  processingChain: ProcessingChainState.getProcessingChain(state)
})

export default connect(
  mapStateToProps,
  { fetchProcessingChain, navigateToProcessingChainsView, putProcessingChainProp, deleteProcessingChain },
)(ProcessingChainView)
