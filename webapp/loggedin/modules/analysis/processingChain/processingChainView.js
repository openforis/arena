import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import ProcessingChain from '../../../../../common/analysis/processingChain'
import ObjectUtils from '../../../../../common/objectUtils'

import LabelsEditor from '../../../surveyViews/labelsEditor/labelsEditor'

import { getUrlParam } from '../../../../utils/routerUtils'

import * as SurveyState from '../../../../survey/surveyState'
import * as ProcessingChainState from './processingChainState'

import { fetchProcessingChain, putProcessingChainProp } from './actions'

const ProcessingChainView = props => {

  const {
    surveyInfo, processingChainUuid, processingChain,
    fetchProcessingChain, putProcessingChainProp,
  } = props

  useEffect(() => {
    fetchProcessingChain(processingChainUuid)
  }, [])

  const onPropLabelsChange = key => labelItem => {
    const labelsUpdated = R.pipe(
      ObjectUtils.getProp(key),
      R.assoc(labelItem.lang, labelItem.label),
    )(processingChain)

    putProcessingChainProp(key, labelsUpdated)
  }

  return processingChain
    ? (
      <div className="processing-chain">
        <div className="form">

          <LabelsEditor
            languages={Survey.getLanguages(surveyInfo)}
            labels={ProcessingChain.getLabels(processingChain)}
            onChange={onPropLabelsChange(ProcessingChain.keysProps.labels)}
          />

          <LabelsEditor
            formLabelKey="common.description"
            languages={Survey.getLanguages(surveyInfo)}
            labels={ProcessingChain.getDescriptions(processingChain)}
            onChange={onPropLabelsChange(ProcessingChain.keysProps.descriptions)}
          />
        </div>
      </div>
    )
    : null
}

const mapStateToProps = (state, { match }) => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  processingChainUuid: getUrlParam('processingChainUuid')(match),
  processingChain: ProcessingChainState.getProcessingChain(state)
})

export default connect(
  mapStateToProps,
  { fetchProcessingChain, putProcessingChainProp, },
)(ProcessingChainView)
