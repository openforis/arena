import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { useLang } from '@webapp/store/system'
import { useCategoryByUuid, useNodeDefByUuid } from '@webapp/store/survey'

import ErrorBadge from '@webapp/components/errorBadge'

const StepItem = (props) => {
  const { step, chain, stepEditing, selectStep } = props

  const lang = useLang()
  const entity = useNodeDefByUuid(Step.getEntityUuid(step))
  const category = useCategoryByUuid(Step.getCategoryUuid(step))
  const editing = Step.isEqual(stepEditing)(step)
  const validation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)

  return (
    <button
      type="button"
      className={`chain-list-item${editing ? ' editing' : ''}`}
      onClick={() => {
        if (!editing) {
          selectStep(step)
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
  step: PropTypes.object.isRequired,
  stepEditing: PropTypes.object.isRequired,
  chain: PropTypes.object.isRequired,
  selectStep: PropTypes.func.isRequired,
}

export default StepItem
