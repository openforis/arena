import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useLang } from '@webapp/store/system'
import { useNodeDefByUuid } from '@webapp/store/survey'

import ErrorBadge from '@webapp/components/errorBadge'

const getClassName = ({ editingSelf, dragging }) => {
  let className = 'chain-list-item'
  className += editingSelf ? ' editing' : ''
  className += dragging ? ' dragging' : ''
  return className
}
const CalculationItem = (props) => {
  const { calculation, dragging, onDragStart, onDragEnd, onDragOver, onDeleteCalculation, analysisState } = props
  const { chain, calculation: calculationForEdit, editingCalculation } = analysisState

  const lang = useLang()
  const nodeDef = useNodeDefByUuid(Calculation.getNodeDefUuid(calculation))

  const validation = Chain.getItemValidationByUuid(Calculation.getUuid(calculation))(chain)
  const editingSelf = Calculation.isEqual(calculationForEdit)(calculation)

  const className = getClassName({ editingSelf, dragging })

  const index = Calculation.getIndex(calculation)

  return (
    <button
      type="button"
      className={className}
      draggable={!editingCalculation}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      data-index={index}
      onClick={() => {
        if (!editingSelf) {
          onDeleteCalculation()
        }
      }}
    >
      <div className="chain-list-item__index">{index + 1}</div>

      <div className="chain-list-item__content calculation-item">
        <div className="chain-list-item__label">
          {Calculation.getLabel(lang)(calculation)} ({nodeDef && NodeDef.getLabel(nodeDef, lang)})
          <ErrorBadge validation={validation} showLabel={false} className="error-badge-inverse" />
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </button>
  )
}

CalculationItem.propTypes = {
  analysisState: PropTypes.object.isRequired,
  calculation: PropTypes.object.isRequired,
  dragging: PropTypes.bool.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDeleteCalculation: PropTypes.func.isRequired,
}

export default CalculationItem
