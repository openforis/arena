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
  const { analysis } = props
  const { chain, step, editingStep, editingCalculation, Actions } = analysis
  const i18n = useI18n()

  const stepNext = Chain.getStepNext(step)(chain)

  const validation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const hasCalculationSteps = (Step.getCalculationsCount(step) || []).length > 0
  const disabledEntityOrCategory = hasCalculationSteps || editingCalculation || Boolean(stepNext)
  const entityUuid = Step.getEntityUuid(step)

  const className = useMemo(() => getClassName({ editingStep, editingCalculation }), [editingStep, editingCalculation])

  return (
    <div className={className}>
      <div className="form">
        {!editingCalculation && (
          <>
            <button type="button" className="btn-s btn-close" onClick={Actions.step.dismiss}>
              <span className="icon icon-10px icon-cross" />
            </button>

            <EntitySelector
              analysis={analysis}
              validation={Validation.getFieldValidation(ChainValidator.keys.entityOrCategory)(validation)}
              onChange={(entityUuidUpdate) => {
                Actions.step.updateProps({
                  [Step.keysProps.entityUuid]: entityUuidUpdate,
                  [Step.keysProps.categoryUuid]: null,
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
                onClick={Actions.addEntityVirtual}
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
                  Actions.step.updateProps({
                    [Step.keysProps.entityUuid]: null,
                    [Step.keysProps.categoryUuid]: Category.getUuid(category),
                  })
                }}
              />
            </div>
          </>
        )}
        <CalculationList analysis={analysis} />
      </div>

      <Calculation analysis={analysis} />
    </div>
  )
}

StepComponent.propTypes = {
  analysis: PropTypes.object.isRequired,
}

export default StepComponent
