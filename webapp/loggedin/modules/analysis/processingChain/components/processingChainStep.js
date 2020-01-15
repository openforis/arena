import './processingChainStep.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { setProcessingStepForEdit } from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainStep = props => {
  const { processingStep } = props

  const entityUuid = ProcessingStep.getEntityUuid(processingStep)
  const survey = useSelector(SurveyState.getSurvey)
  const entity = entityUuid ? Survey.getNodeDefByUuid(entityUuid)(survey) : null
  const processingStepEditing = useSelector(ProcessingStepState.getProcessingStep)

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div
      className={`processing-chain__step${
        ProcessingStep.isEqual(processingStepEditing)(processingStep) ? ' editing' : ''
      }`}
      onClick={() => dispatch(setProcessingStepForEdit(processingStep))}
    >
      <div className="processing-chain__step-index">{ProcessingStep.getIndex(processingStep) + 1}</div>
      <div className="processing-chain__step-content">
        <div>{entity && NodeDef.getLabel(entity, i18n.lang)}</div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </div>
  )
}

export default ProcessingChainStep
