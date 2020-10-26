import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/stepVariable'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import { ExpressionEditorType } from '@webapp/components/expression/expressionEditorType'

import { State } from '../store'

const VariablePrevStepEditor = (props) => {
  const { Actions, state } = props

  const i18n = useI18n()

  const survey = useSurvey()

  const chain = State.getChainEdit(state)
  const step = State.getStepEdit(state)
  const stepPrev = Chain.getStepPrev(step)(chain)
  const stepPrevEntityDefUuid = Step.getEntityUuid(stepPrev)
  const prevStepVariableEdit = State.getVariablePrevStepEdit(state)

  const variableUuid = StepVariable.getUuid(prevStepVariableEdit)
  const variableLabel = A.pipe(Survey.getNodeDefByUuid(variableUuid), (nodeDef) =>
    NodeDef.getLabel(nodeDef, i18n.lang)
  )(survey)

  return prevStepVariableEdit ? (
    <ExpressionEditorPopup
      header={i18n.t('processingStepView.variablesPreviousStep.aggregateFunctionOfVariable', { variableLabel })}
      query={StepVariable.getAggregate(prevStepVariableEdit)}
      nodeDefUuidContext={stepPrevEntityDefUuid}
      mode={Expression.modes.sql}
      type={[ExpressionEditorType.advanced]}
      onChange={(query) => {
        const variableUpdated = StepVariable.assocAggregate(query)(prevStepVariableEdit)
        Actions.updatePreviousStepVariable({ variable: variableUpdated })
      }}
      onClose={Actions.dismissStepVariableEditor}
    />
  ) : null
}

VariablePrevStepEditor.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default VariablePrevStepEditor
