import './processingChainStep.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

import { navigateToProcessingStepView } from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainStep = props => {
  const {
    history,
    processingStep,
    lang,
    entity,
    navigateToProcessingStepView,
  } = props

  return (
    <div
      className="processing-chain__step"
      onClick={() =>
        navigateToProcessingStepView(
          history,
          ProcessingStep.getUuid(processingStep),
        )
      }
    >
      <div className="processing-chain__step-index">
        {ProcessingStep.getIndex(processingStep) + 1}
      </div>
      <div className="processing-chain__step-content">
        <div>{entity && NodeDef.getLabel(entity, lang)}</div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </div>
  )
}

const mapStateToProps = (state, { processingStep }) => {
  const entityUuid = ProcessingStep.getEntityUuid(processingStep)
  const survey = SurveyState.getSurvey(state)
  return {
    lang: AppState.getLang(state),
    entity: entityUuid ? Survey.getNodeDefByUuid(entityUuid)(survey) : null,
  }
}

export default connect(mapStateToProps, { navigateToProcessingStepView })(
  ProcessingChainStep,
)
