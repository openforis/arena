import './Step.scss'
import React from 'react'
import PropTypes from 'prop-types'

import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'
import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import { useI18n } from '@webapp/store/system'

import CategorySelector from '@webapp/components/survey/CategorySelector'

import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'
import { useAddEntityVirtual } from '../store/hooks'
import EntitySelector from './EntitySelector'
import CalculationList from './CalculationList'

const getClassName = ({ editingStep, editingCalculation }) => {
  let className = 'step chain-form'
  if (editingStep) className += ' show'
  if (editingCalculation) className += ' show-calculation'
  return className
}

const StepComponent = ({ analysisState, analysisActions }) => {
  const { chain, step, calculation, editingStep, editingCalculation } = analysisState
  const { step: stepActions } = analysisActions
  const history = useHistory()
  const i18n = useI18n()

  // TO REFACTOR
  const { stepNext, stepPrev } = useChainEdit()

  const validation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const hasCalculationSteps = (Step.getCalculationsCount(step) || []).length > 0
  const disabledEntityOrCategory = hasCalculationSteps || editingCalculation || Boolean(stepNext)
  const entityUuid = Step.getEntityUuid(step)

  /* useOnUpdate(() => {
    // Validate step on calculation editor close (calculations may have been added / deleted)
    if (!editingCalculation) {
      dispatch(validateStep())
    }
  }, [editingCalculation]) */

  const className = getClassName({ editingStep, editingCalculation })

  const onAddEntityVirtual = () => React.useCallback(useAddEntityVirtual(), [])

  return (
    <div className={className}>
      <div className="form">
        {!editingCalculation && (
          <>
            <button type="button" className="btn-s btn-close" onClick={stepActions.delete}>
              <span className="icon icon-10px icon-cross" />
            </button>

            <EntitySelector
              step={step}
              stepPrev={stepPrev}
              validation={Validation.getFieldValidation(ChainValidator.keys.entityOrCategory)(validation)}
              onChange={(entityUuidUpdate) => {
                stepActions.update({
                  [Step.keysProps.entityUuid]: entityUuidUpdate,
                  [Step.keysProps.categoryUuid]: null,
                })
              }}
              readOnly={disabledEntityOrCategory}
            >
              <button
                type="button"
                className="btn btn-s btn-edit"
                onClick={() => history.push(`${appModuleUri(analysisModules.nodeDef)}${entityUuid}/`)}
                aria-disabled={!entityUuid}
              >
                <span className="icon icon-pencil2 icon-12px icon-left" />
                {i18n.t('common.edit')}
              </button>
              <button
                type="button"
                className="btn btn-s btn-add"
                onClick={onAddEntityVirtual}
                aria-disabled={hasCalculationSteps}
              >
                <span className="icon icon-plus icon-12px icon-left" />
                {i18n.t('processingStepView.virtualEntity')}
              </button>
            </EntitySelector>

            <div className="form-item processing-step__category-selector-form-item">
              <div className="form-label chain-list__label">{i18n.t('nodeDefEdit.codeProps.category')}</div>
              <CategorySelector
                disabled={disabledEntityOrCategory}
                categoryUuid={Step.getCategoryUuid(step)}
                validation={Validation.getFieldValidation(ChainValidator.keys.entityOrCategory)(validation)}
                showManage={false}
                showAdd={false}
                onChange={(category) => {
                  stepActions.update({
                    [Step.keysProps.entityUuid]: null,
                    [Step.keysProps.categoryUuid]: Category.getUuid(category),
                  })
                }}
              />
            </div>
          </>
        )}
        <CalculationList analysisState={analysisState} analysisActions={analysisActions} />
      </div>

      <p>{JSON.stringify(calculation)}</p>
    </div>
  )
}

StepComponent.propTypes = {
  analysisState: PropTypes.object.isRequired,
  analysisActions: PropTypes.object.isRequired,
}

export default StepComponent
