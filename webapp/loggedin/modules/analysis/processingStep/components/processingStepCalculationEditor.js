import './processingStepCalculationEditor.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem } from '@webapp/commonComponents/form/input'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { setProcessingStepCalculationForEdit } from '../actions'
import { updateProcessingStepCalculationProp } from '../../processingStepCalculation/actions'

const ProcessingStepCalculationEditor = props => {
  const { surveyInfo, calculation, setProcessingStepCalculationForEdit, updateProcessingStepCalculationProp } = props

  const i18n = useI18n()
  const types = [
    {
      key: ProcessingStepCalculation.types.quantitative,
      label: i18n.t('processingStepCalculationView.types.quantitative'),
    },
    {
      key: ProcessingStepCalculation.types.categorical,
      label: i18n.t('processingStepCalculationView.types.categorical'),
    },
  ]

  return (
    <div className="processing-step__calculation-editor">
      <button className="btn btn-close" onClick={() => setProcessingStepCalculationForEdit(null)}>
        <span className="icon icon-cross icon-10px" />
      </button>

      <LabelsEditor
        languages={Survey.getLanguages(surveyInfo)}
        labels={ProcessingStepCalculation.getLabels(calculation)}
        onChange={labels => updateProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.labels, labels)}
      />

      <FormItem label={i18n.t('common.type')}>
        <ButtonGroup
          selectedItemKey={ProcessingStepCalculation.getType(calculation)}
          onChange={type => updateProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.type, type)}
          items={types}
        />
      </FormItem>
    </div>
  )
}

ProcessingStepCalculationEditor.defaultProps = {
  surveyInfo: null,
  calculation: null,
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  calculation: ProcessingStepCalculationState.getCalculation(state),
})

export default connect(mapStateToProps, {
  setProcessingStepCalculationForEdit,
  updateProcessingStepCalculationProp,
})(ProcessingStepCalculationEditor)
