import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n, useLang, useNodeDefByUuid } from '@webapp/commonComponents/hooks'
import ErrorBadge from '@webapp/commonComponents/errorBadge'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { setCalculationForEdit } from '@webapp/loggedin/modules/analysis/step/actions'

const CalculationItem = (props) => {
  const { calculation, dragging, onDragStart, onDragEnd, onDragOver } = props

  const lang = useLang()
  const nodeDef = useNodeDefByUuid(Calculation.getNodeDefUuid(calculation))
  const chain = useSelector(ChainState.getProcessingChain)
  const calculationEditDirty = useSelector(CalculationState.isDirty)
  const editingCalculation = useSelector(CalculationState.isEditingCalculation)
  const calculationForEdit = useSelector(CalculationState.getCalculation)
  const validation = Chain.getItemValidationByUuid(Calculation.getUuid(calculation))(chain)

  const i18n = useI18n()
  const dispatch = useDispatch()

  const editingSelf = Calculation.isEqual(calculationForEdit)(calculation)

  let className = 'chain-list-item'
  className += editingSelf ? ' editing' : ''
  className += dragging ? ' dragging' : ''

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
          if (calculationEditDirty)
            dispatch(showDialogConfirm('common.cancelConfirm', {}, setCalculationForEdit(calculation)))
          else dispatch(setCalculationForEdit(calculation))
        }
      }}
    >
      <div className="chain-list-item__index">{index + 1}</div>

      <div className="chain-list-item__content calculation-item">
        <div className="chain-list-item__label">
          {Calculation.getLabel(i18n.lang)(calculation)} ({nodeDef && NodeDef.getLabel(nodeDef, lang)})
          <ErrorBadge validation={validation} showLabel={false} className="error-badge-inverse" />
        </div>
        <span className="icon icon-pencil2 icon-10px icon-edit" />
      </div>
    </button>
  )
}

CalculationItem.propTypes = {
  calculation: PropTypes.object.isRequired,
  dragging: PropTypes.bool.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
}

export default CalculationItem
