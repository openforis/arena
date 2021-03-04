import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { useLang } from '@webapp/store/system'
import { useNodeDefByUuid, useSurveyId } from '@webapp/store/survey'

import ErrorBadge from '@webapp/components/errorBadge'

import { useFetchCategoryByUuid } from '@webapp/service/hooks'
import { State } from '../../store'

const StepItem = (props) => {
  const { state, step, Actions } = props

  const surveyId = useSurveyId()
  const chain = State.getChainEdit(state)
  const stepEditing = State.getStepEdit(state)
  const lang = useLang()
  const entity = useNodeDefByUuid(Step.getEntityUuid(step))
  const categoryUuid = Step.getCategoryUuid(step)
  const editing = Step.isEqual(stepEditing)(step)
  const validation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const { category } = useFetchCategoryByUuid({ surveyId, categoryUuid })

  return (
    <button
      type="button"
      className={`chain-list-item${editing ? ' editing' : ''}`}
      onClick={() => {
        if (!editing) {
          Actions.selectStep({ step, state })
        }
      }}
    >
      <div className="chain-list-item__index">{Step.getIndex(step) + 1}</div>
      <div className="chain-list-item__content step-item">
        <div className="chain-list-item__label">
          {(entity && NodeDef.getLabel(entity, lang)) || (category && Category.getName(category))}
          <ErrorBadge validation={validation} className="error-badge-inverse" showLabel={false} />
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </button>
  )
}

StepItem.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  step: PropTypes.object.isRequired,
}

export default StepItem
