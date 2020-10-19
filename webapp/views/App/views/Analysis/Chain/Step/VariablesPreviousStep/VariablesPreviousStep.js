import './VariablesPreviousStep.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as StepVariable from '@common/analysis/stepVariable'

import Checkbox from '@webapp/components/form/checkbox'
import ValidationTooltip from '@webapp/components/validationTooltip'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import { useVariablesPreviousStep } from './useVariablesPreviousStep'

const VariablesPreviousStep = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const {
    variables,
    variableHighlightedUuid,
    validation,
    variableEdit,
    setVariableEdit,
    stepPrevEntityDefUuid,
  } = useVariablesPreviousStep({ state })

  const getVariableLabel = (variable) => {
    const variableUuid = StepVariable.getUuid(variable)
    return A.pipe(Survey.getNodeDefByUuid(variableUuid), (nodeDef) => NodeDef.getLabel(nodeDef, i18n.lang))(survey)
  }

  return variables.length ? (
    <div className="processing-step__variables-previous-step-form-item form-item">
      <ValidationTooltip validation={validation} showKeys>
        <div className={classNames('form-label', { error: !Validation.isValid(validation) })}>
          {i18n.t('processingStepView.variablesPreviousStep.title')}
        </div>
      </ValidationTooltip>
      <div className="table processing-step__variables-previous-step-table">
        <div className="table__content">
          <div className="table__row-header">
            <div>{i18n.t('processingStepView.variablesPreviousStep.variableName')}</div>
            <div>{i18n.t('processingStepView.variablesPreviousStep.include')}</div>
            <div>{i18n.t('processingStepView.variablesPreviousStep.aggregate')}</div>
          </div>
          <div className="table__rows">
            {variables.map((variablePrevStep) => {
              const variableUuid = StepVariable.getUuid(variablePrevStep)
              const variableLabel = getVariableLabel(variablePrevStep)
              return (
                <div
                  key={variableUuid}
                  className={classNames('table__row', { highlighted: variableUuid === variableHighlightedUuid })}
                >
                  <div>{variableLabel}</div>
                  <div>
                    <Checkbox
                      checked={StepVariable.getInclude(variablePrevStep)}
                      onChange={(include) => Actions.togglePreviousStepVariable({ variableUuid, include })}
                    />
                  </div>
                  <div>{StepVariable.getAggregate(variablePrevStep)}</div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-s btn-edit"
                      aria-disabled={!StepVariable.getInclude(variablePrevStep)}
                      onClick={() => setVariableEdit(variablePrevStep)}
                    >
                      <span className="icon icon-pencil2 icon-14px" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {variableEdit && (
        <ExpressionEditorPopup
          header={i18n.t('processingStepView.variablesPreviousStep.aggregateFunctionOfVariable', {
            variableLabel: getVariableLabel(variableEdit),
          })}
          query={StepVariable.getAggregate(variableEdit)}
          nodeDefUuidContext={stepPrevEntityDefUuid}
          mode={Expression.modes.sql}
          onlyAdvanced
          onChange={(query) => {
            const variableUpdated = StepVariable.assocAggregate(query)(variableEdit)
            Actions.updatePreviousStepVariable({ variable: variableUpdated })
            setVariableEdit(null)
          }}
          onClose={() => setVariableEdit(null)}
        />
      )}
    </div>
  ) : null
}

VariablesPreviousStep.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default VariablesPreviousStep
