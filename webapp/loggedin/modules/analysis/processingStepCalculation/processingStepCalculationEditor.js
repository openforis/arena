import './processingStepCalculationEditor.scss'

import React, { useState } from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem } from '@webapp/commonComponents/form/input'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import Dropdown from '@webapp/commonComponents/form/dropdown'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import {
  setProcessingStepCalculationProp,
  setProcessingStepCalculationAttribute,
  saveProcessingStepCalculationEdits,
  cancelProcessingStepCalculationEdits,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const ProcessingStepCalculationEditor = props => {
  const {
    surveyInfo,
    calculation,
    validation,
    attributes,
    attribute,
    isDirty,
    setProcessingStepCalculationProp,
    setProcessingStepCalculationAttribute,
    saveProcessingStepCalculationEdits,
    cancelProcessingStepCalculationEdits,
  } = props

  const i18n = useI18n()

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const types = R.pipe(
    R.keys,
    R.map(type => ({
      key: type,
      label: i18n.t(`processingStepCalculationView.types.${type}`),
    })),
  )(ProcessingStepCalculation.type)

  const aggregateFns = R.pipe(
    R.keys,
    R.map(fn => ({
      key: fn,
      label: i18n.t(`processingStepCalculationView.aggregateFunctions.${fn}`),
    })),
  )(ProcessingStepCalculation.aggregateFn)

  return (
    <>
      <div className="processing-step__calculation-editor">
        <button
          className="btn btn-close"
          onClick={() => (isDirty ? setShowCancelConfirm(true) : cancelProcessingStepCalculationEdits())}
        >
          <span className="icon icon-cross icon-10px" />
        </button>

        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingStepCalculation.getLabels(calculation)}
          onChange={labels => setProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.labels, labels)}
        />

        <FormItem label={i18n.t('common.type')}>
          <ButtonGroup
            selectedItemKey={ProcessingStepCalculation.getType(calculation)}
            onChange={type => setProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.type, type)}
            items={types}
          />
        </FormItem>

        <FormItem label={i18n.t('processingStepCalculationView.attribute')}>
          <Dropdown
            items={attributes}
            selection={attribute}
            itemKeyProp={ProcessingStepCalculation.keys.uuid}
            itemLabelFunction={attrDef => NodeDef.getLabel(attrDef, i18n.lang)}
            onChange={def => setProcessingStepCalculationAttribute(NodeDef.getUuid(def))}
            validation={Validation.getFieldValidation(ProcessingStepCalculation.keys.nodeDefUuid)(validation)}
          />
        </FormItem>

        <FormItem label={i18n.t('processingStepCalculationView.aggregateFunction')}>
          <ButtonGroup
            selectedItemKey={ProcessingStepCalculation.getAggregateFunction(calculation)}
            onChange={aggregateFn =>
              setProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.aggregateFn, aggregateFn)
            }
            items={aggregateFns}
          />
        </FormItem>

        <div className="button-bar">
          <button className="btn btn-primary" onClick={saveProcessingStepCalculationEdits} aria-disabled={!isDirty}>
            <span className="icon icon-floppy-disk icon-left icon-12px" />
            {i18n.t('common.save')}
          </button>
        </div>
      </div>

      {showCancelConfirm && (
        <ConfirmDialog
          message={i18n.t('processingStepCalculationView.confirmCancel')}
          onOk={() => {
            setShowCancelConfirm(false)
            cancelProcessingStepCalculationEdits()
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  )
}

ProcessingStepCalculationEditor.defaultProps = {
  surveyInfo: null,
  calculation: null,
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const calculation = ProcessingStepCalculationState.getCalculationTemp(state)
  const validation = ProcessingStepCalculationState.getValidation(state)
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
    validation,
    attributes,
    attribute,
    isDirty: ProcessingStepCalculationState.isDirty(state),
  }
}

export default connect(mapStateToProps, {
  setProcessingStepCalculationProp,
  setProcessingStepCalculationAttribute,
  saveProcessingStepCalculationEdits,
  cancelProcessingStepCalculationEdits,
})(ProcessingStepCalculationEditor)
