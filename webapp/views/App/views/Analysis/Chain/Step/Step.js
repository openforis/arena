import './Step.scss'
import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import * as Category from '@core/survey/category'
import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import { useI18n } from '@webapp/store/system'

import CategorySelector from '@webapp/components/survey/CategorySelector'

import { State } from '../store'

import EntitySelector from './EntitySelector'
import CalculationList from './CalculationList'
import Calculation from './Calculation'

const getClassName = ({ editingStep, editingCalculation }) => {
  let className = 'step chain-form'
  if (editingStep) className += ' show'
  if (editingCalculation) className += ' show-calculation'
  return className
}

const StepComponent = (props) => {
  const { state, Actions } = props

  const chainEdit = State.getChainEdit(state)
  const stepEdit = State.getStepEdit(state)
  const editingStep = Boolean(State.getStepEdit(state))
  const editingCalculation = Boolean(State.getCalculationEdit(state))

  const i18n = useI18n()

  const stepNext = Chain.getStepNext(stepEdit)(chainEdit)

  const validation = Chain.getItemValidationByUuid(Step.getUuid(stepEdit))(chainEdit)
  const hasCalculationSteps = (Step.getCalculationsCount(stepEdit) || []).length > 0
  const disabledEntityOrCategory = hasCalculationSteps || editingCalculation || Boolean(stepNext)
  const entityUuid = Step.getEntityUuid(stepEdit)

  const className = useMemo(() => getClassName({ editingStep, editingCalculation }), [editingStep, editingCalculation])

  return (
    <div className={className}>
      <div className="form">
        {!editingCalculation && (
          <>
            <button type="button" className="btn-s btn-close" onClick={() => Actions.dismissStep({ state })}>
              <span className="icon icon-10px icon-cross" />
            </button>

            <EntitySelector
              state={state}
              Actions={Actions}
              validation={Validation.getFieldValidation(ChainValidator.keys.entityOrCategory)(validation)}
              onChange={(entityUuidUpdate) => {
                Actions.updatePropsStep({
                  props: {
                    [Step.keysProps.entityUuid]: entityUuidUpdate,
                  },
                  state,
                })
              }}
              readOnly={disabledEntityOrCategory}
            >
              <Link
                type="button"
                className="btn btn-s btn-edit"
                to={`${appModuleUri(analysisModules.nodeDef)}${entityUuid}/`}
                aria-disabled={!entityUuid}
              >
                <span className="icon icon-pencil2 icon-12px icon-left" />
                {i18n.t('common.edit')}
              </Link>
              <button
                type="button"
                className="btn btn-s btn-add"
                onClick={() => Actions.addEntityVirtual({ state })}
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
                categoryUuid={Step.getCategoryUuid(stepEdit)}
                validation={Validation.getFieldValidation(ChainValidator.keys.entityOrCategory)(validation)}
                showManage={false}
                showAdd={false}
                onChange={(category) => {
                  Actions.updatePropsStep({
                    props: {
                      [Step.keysProps.categoryUuid]: Category.getUuid(category),
                    },
                    state,
                  })
                }}
              />
            </div>
          </>
        )}
        <CalculationList state={state} Actions={Actions} />
      </div>

      <Calculation state={state} Actions={Actions} />
    </div>
  )
}

StepComponent.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default StepComponent
