import './VariablesPreviousStep.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as StepVariable from '@common/analysis/stepVariable'

import Checkbox from '@webapp/components/form/checkbox'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import { useVariablesPreviousStep } from './useVariablesPreviousStep'

const VariablesPreviousStep = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const { variablesPrevStep, validation } = useVariablesPreviousStep({ state })

  return variablesPrevStep.length ? (
    <div className="form-item">
      <ValidationTooltip validation={validation} showKeys>
        <div className={classnames('form-label', { error: !Validation.isValid(validation) })}>
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
            {variablesPrevStep.map((variablePrevStep) => {
              const variableUuid = StepVariable.getUuid(variablePrevStep)
              const nodeDefLabel = A.pipe(Survey.getNodeDefByUuid(variableUuid), (nodeDef) =>
                NodeDef.getLabel(nodeDef, i18n.lang)
              )(survey)
              return (
                <div key={variableUuid} className="table__row">
                  <div>{nodeDefLabel}</div>
                  <div>
                    <Checkbox
                      checked={StepVariable.getInclude(variablePrevStep)}
                      onChange={(include) => Actions.togglePreviousStepVariable({ variableUuid, include })}
                    />
                  </div>
                  <div>{StepVariable.getAggregate(variablePrevStep)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  ) : null
}

VariablesPreviousStep.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default VariablesPreviousStep
