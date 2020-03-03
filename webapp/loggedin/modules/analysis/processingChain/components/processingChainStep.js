import './processingChainStep.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { setProcessingStepForEdit } from '@webapp/loggedin/modules/analysis/processingStep/actions'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

const ProcessingChainStep = props => {
  const { processingStep, validation } = props

  const survey = useSelector(SurveyState.getSurvey)
  const entity = R.pipe(ProcessingStep.getEntityUuid, entityUuid => Survey.getNodeDefByUuid(entityUuid)(survey))(
    processingStep,
  )
  const category = R.pipe(ProcessingStep.getCategoryUuid, categoryUuid =>
    Survey.getCategoryByUuid(categoryUuid)(survey),
  )(processingStep)
  const processingStepEditing = useSelector(ProcessingStepState.getProcessingStep)
  const editing = ProcessingStep.isEqual(processingStepEditing)(processingStep)

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div
      className={`processing-chain__step${editing ? ' editing' : ''}`}
      onClick={() => {
        if (!editing) {
          dispatch(setProcessingStepForEdit(processingStep))
        }
      }}
    >
      <div className="processing-chain__step-index">{ProcessingStep.getIndex(processingStep) + 1}</div>
      <div className="processing-chain__step-content">
        <div className="processing-chain__step-label">
          {(entity && NodeDef.getLabel(entity, i18n.lang)) || (category && Category.getName(category))}
          <ErrorBadge validation={validation} className="error-badge-inverse" showLabel={false} />
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </div>
  )
}

ProcessingChainStep.defaultProps = {
  processingStep: null,
  validation: null,
}

export default ProcessingChainStep
