import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { useCategoryByUuid, useI18n, useNodeDefByUuid } from '@webapp/commonComponents/hooks'
import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

import { setStepForEdit } from '@webapp/loggedin/modules/analysis/step/actions'

const StepItem = (props) => {
  const { step } = props

  const i18n = useI18n()
  const dispatch = useDispatch()
  const entity = useNodeDefByUuid(Step.getEntityUuid(step))
  const category = useCategoryByUuid(Step.getCategoryUuid(step))
  const { chain, step: stepEditing } = useChainEdit()
  const editing = Step.isEqual(stepEditing)(step)
  const validation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)

  return (
    <button
      type="button"
      className={`chain-list-item${editing ? ' editing' : ''}`}
      onClick={() => {
        if (!editing) {
          dispatch(setStepForEdit(step))
        }
      }}
    >
      <div className="chain-list-item__index">{Step.getIndex(step) + 1}</div>
      <div className="chain-list-item__content step-item">
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
