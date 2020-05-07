import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { useI18n, useSurvey } from '@webapp/commonComponents/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { setProcessingStepForEdit } from '@webapp/loggedin/modules/analysis/processingStep/actions'

const StepItem = (props) => {
  const { step } = props
  const survey = useSurvey()
  const entity = R.pipe(Step.getEntityUuid, (entityUuid) => Survey.getNodeDefByUuid(entityUuid)(survey))(step)
  const category = R.pipe(Step.getCategoryUuid, (categoryUuid) => Survey.getCategoryByUuid(categoryUuid)(survey))(step)
  const chain = useSelector(ChainState.getProcessingChain)
  const stepEditing = useSelector(StepState.getProcessingStep)
  const editing = Step.isEqual(stepEditing)(step)
  const validation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <button
      type="button"
      className={`chain-list-item${editing ? ' editing' : ''}`}
      onClick={() => {
        if (!editing) {
          dispatch(setProcessingStepForEdit(step))
        }
      }}
    >
      <div className="chain-list-item__index">{Step.getIndex(step) + 1}</div>
      <div className="chain-list-item__content">
        <div className="chain-list-item__label">
          {(entity && NodeDef.getLabel(entity, i18n.lang)) || (category && Category.getName(category))}
          <ErrorBadge validation={validation} className="error-badge-inverse" showLabel={false} />
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </button>
  )
}

StepItem.propTypes = {
  step: PropTypes.object.isRequired,
}

export default StepItem
