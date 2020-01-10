import './processingStepCalculationEditor.scss'

import React, { useState } from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'

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
  resetProcessingStepCalculationState,
  createNodeDefAnalysis,
  deleteProcessingStepCalculation,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const ProcessingStepCalculationEditor = props => {
  const {
    surveyInfo,
    calculation,
    attributes,
    attribute,
    isDirty,
    setProcessingStepCalculationProp,
    setProcessingStepCalculationAttribute,
    saveProcessingStepCalculationEdits,
    resetProcessingStepCalculationState,
    createNodeDefAnalysis,
  } = props
  const validation = ProcessingStepCalculation.getValidation(calculation)

  const i18n = useI18n()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const history = useHistory()

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
    calculation && (
      <>
        <div className="processing-step__calculation-editor">
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
            <div className="processing-step__calculation__attribute-container">
              <Dropdown
                items={attributes}
                selection={attribute}
                itemKeyProp={ProcessingStepCalculation.keys.uuid}
                itemLabelFunction={attrDef =>
                  `${NodeDef.getLabel(attrDef, i18n.lang)}${NodeDef.isAnalysis(attrDef) ? ' (c)' : ''}`
                }
                onChange={def => setProcessingStepCalculationAttribute(NodeDef.getUuid(def))}
                validation={Validation.getFieldValidation(ProcessingStepCalculation.keys.nodeDefUuid)(validation)}
              />
              <button
                className="btn btn-s"
                style={{ justifySelf: 'center' }}
                onClick={() => createNodeDefAnalysis(history)}
              >
                <span className="icon icon-plus icon-12px icon-left" />
                {i18n.t('common.add')}
              </button>
            </div>
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
            <button
              className="btn-s btn-cancel"
              onClick={() => (isDirty ? setShowCancelConfirm(true) : resetProcessingStepCalculationState())}
            >
              <span className="icon icon-cross icon-left icon-10px" />
              {i18n.t(isDirty ? 'common.cancel' : 'common.close')}
            </button>
            <button className="btn-s btn-primary" onClick={saveProcessingStepCalculationEdits} aria-disabled={!isDirty}>
              <span className="icon icon-floppy-disk icon-left icon-12px" />
              {i18n.t('common.save')}
            </button>
            <button
              className="btn-s btn-danger btn-delete"
              aria-disabled={ProcessingStepCalculation.isTemporary(calculation)}
              onClick={() => (isDirty ? setShowCancelConfirm(true) : resetProcessingStepCalculationState())}
            >
              <span className="icon icon-bin icon-left icon-12px" />
              {i18n.t('common.delete')}
            </button>
          </div>
        </div>

        {showCancelConfirm && (
          <ConfirmDialog
            message={i18n.t('common.cancelConfirm')}
            onOk={() => {
              setShowCancelConfirm(false)
              resetProcessingStepCalculationState()
            }}
            onCancel={() => setShowCancelConfirm(false)}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmDialog
            message={i18n.t('processingStepCalculationView.deleteConfirm')}
            onOk={() => {
              setShowDeleteConfirm(false)
              deleteProcessingStepCalculation()
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </>
    )
  )
}

ProcessingStepCalculationEditor.defaultProps = {
  surveyInfo: null,
  calculation: null,
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const calculation = ProcessingStepCalculationState.getCalculationDirty(state)
  const attributes = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.getEntityUuid,
    entityDefUuid => Survey.getNodeDefByUuid(entityDefUuid)(survey),
    entityDef => Survey.getNodeDefChildren(entityDef, true)(survey),
    R.filter(R.pipe(NodeDef.getType, R.equals(ProcessingStepCalculation.getNodeDefType(calculation)))),
  )(state)
  const attribute = R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid =>
    Survey.getNodeDefByUuid(nodeDefUuid)(survey),
  )(calculation)

  return {
    surveyInfo: Survey.getSurveyInfo(survey),
    calculation,
    attributes,
    attribute,
    isDirty: ProcessingStepCalculationState.isDirty(state),
  }
}

export default connect(mapStateToProps, {
  setProcessingStepCalculationProp,
  setProcessingStepCalculationAttribute,
  saveProcessingStepCalculationEdits,
  resetProcessingStepCalculationState,
  createNodeDefAnalysis,
  deleteProcessingStepCalculation,
})(ProcessingStepCalculationEditor)
