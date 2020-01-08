import './processingStepCalculationEditor.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem } from '@webapp/commonComponents/form/input'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { setProcessingStepCalculationForEdit } from '../actions'
import {
  updateProcessingStepCalculationProp,
  updateProcessingStepCalculationAttribute,
} from '../../processingStepCalculation/actions'
import Dropdown from '@webapp/commonComponents/form/dropdown'

const ProcessingStepCalculationEditor = props => {
  const {
    surveyInfo,
    calculation,
    attributes,
    attribute,
    setProcessingStepCalculationForEdit,
    updateProcessingStepCalculationProp,
    updateProcessingStepCalculationAttribute,
  } = props

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

      <FormItem label={i18n.t('processingStepCalculationView.attribute')}>
        <Dropdown
          items={attributes}
          selection={attribute}
          itemKeyProp={ProcessingStepCalculation.keys.uuid}
          itemLabelFunction={attrDef => NodeDef.getLabel(attrDef, i18n.lang)}
          onChange={def => updateProcessingStepCalculationAttribute(NodeDef.getUuid(def))}
        />
      </FormItem>
    </div>
  )
}

ProcessingStepCalculationEditor.defaultProps = {
  surveyInfo: null,
  calculation: null,
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const calculation = ProcessingStepCalculationState.getCalculation(state)
  const attributes = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.getEntityUuid,
    entityDefUuid => Survey.getNodeDefByUuid(entityDefUuid)(survey),
    entityDef => Survey.getNodeDefChildren(entityDef)(survey),
    R.filter(
      R.ifElse(R.always(ProcessingStepCalculation.isQuantitative(calculation)), NodeDef.isDecimal, NodeDef.isCode),
    ),
  )(state)
  const attribute = R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid =>
    Survey.getNodeDefByUuid(nodeDefUuid)(survey),
  )(calculation)

  return {
    surveyInfo: Survey.getSurveyInfo(survey),
    calculation,
    attributes,
    attribute,
  }
}

export default connect(mapStateToProps, {
  setProcessingStepCalculationForEdit,
  updateProcessingStepCalculationProp,
  updateProcessingStepCalculationAttribute,
})(ProcessingStepCalculationEditor)
