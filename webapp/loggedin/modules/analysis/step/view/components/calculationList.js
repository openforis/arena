import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'
import ValidationTooltip from '@webapp/commonComponents/validationTooltip'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'
import { createCalculation } from '@webapp/loggedin/modules/analysis/step/actions'

import CalculationItem from './calculationItem'
import useCalculationListState from './useCalculationListState'

const CalculationList = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useSelector(ChainState.getProcessingChain)
  const step = useSelector(StepState.getProcessingStep)
  const editingCalculation = useSelector(CalculationState.isEditingCalculation)
  const calculations = Step.getCalculations(step)
  const stepValidation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const calculationsValidation = Validation.getFieldValidation(Step.keys.calculations)(stepValidation)

  const placeholderRef = useRef(null)
  const { dragging, onDragStart, onDragEnd, onDragOver } = useCalculationListState(placeholderRef)

  return (
    <div className="form-item">
      {!editingCalculation && (
        <div className="form-label chain-list__label">
          <ValidationTooltip validation={calculationsValidation}>
            {i18n.t('processingStepView.calculationSteps')}
          </ValidationTooltip>
          <button type="button" className="btn-s btn-transparent" onClick={() => dispatch(createCalculation())}>
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      <div className="chain-list">
        {calculations.map((calculation) => (
          <CalculationItem
            key={Calculation.getUuid(calculation)}
            calculation={calculation}
            dragging={dragging}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
          />
        ))}

        <div className="chain-list-item placeholder" ref={placeholderRef}>
          <div className="chain-list-item__index" />
          <div className="chain-list-item__content" />
        </div>
      </div>
    </div>
  )
}

export default CalculationList
