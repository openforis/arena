import './VariablesPreviousStep.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/processingStepVariable'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import Checkbox from '@webapp/components/form/checkbox'
import { State } from '../../store'

const VariablesPreviousStep = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()
  const survey = useSurvey()

  const stepEdit = State.getStepEdit(state)
  const variablesPrevStep = Step.getVariablesPreviousStep(stepEdit)

  return variablesPrevStep.length ? (
    <div className="form-item">
      <div className="form-label">{i18n.t('processingStepView.variablesPreviousStep.title')}</div>
      <div className="table processing-step__variables-previous-step-table">
        <div className="table__content">
          <div className="table__row-header">
            <div>{i18n.t('processingStepView.variablesPreviousStep.variableName')}</div>
            <div>{i18n.t('processingStepView.variablesPreviousStep.include')}</div>
            <div>{i18n.t('processingStepView.variablesPreviousStep.aggregate')}</div>
          </div>
          <div className="table__rows">
            {variablesPrevStep.map((variablePrevStep) => {
              const nodeDefUuid = StepVariable.getUuid(variablePrevStep)
              const nodeDefLabel = A.pipe(Survey.getNodeDefByUuid(nodeDefUuid), (nodeDef) =>
                NodeDef.getLabel(nodeDef, i18n.lang)
              )(survey)
              return (
                <div key={nodeDefUuid} className="table__row">
                  <div>{nodeDefLabel}</div>
                  <div>
                    <Checkbox
                      checked={StepVariable.getInclude(variablePrevStep)}
                      onChange={(checked) =>
                        Actions.updatePreviousStepVariable({
                          variable: StepVariable.assocInclude(checked)(variablePrevStep),
                        })
                      }
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
