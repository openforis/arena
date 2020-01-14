import './processingStepCalculationEditor.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as Validation from '@core/validation/validation'

import { FormItem } from '@webapp/commonComponents/form/input'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import Dropdown from '@webapp/commonComponents/form/dropdown'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'

import {
  setProcessingStepCalculationProp,
  setProcessingStepCalculationAttribute,
  saveProcessingStepCalculationEdits,
  resetProcessingStepCalculationState,
  createNodeDefAnalysis,
  deleteProcessingStepCalculation,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'
import useProcessingStepCalculationEditorState from './useProcessingStepCalculationEditorState'

const ProcessingStepCalculationEditor = () => {
  const {
    i18n,

    surveyInfo,
    calculation,
    attributes,
    attribute,
    isDirty,

    types,
    aggregateFns,

    showCancelConfirm,
    setShowCancelConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
  } = useProcessingStepCalculationEditorState()

  const dispatch = useDispatch()
  const history = useHistory()

  const validation = ProcessingStepCalculation.getValidation(calculation)

  return calculation ? (
    <>
      <div className="processing-step__calculation-editor">
        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingStepCalculation.getLabels(calculation)}
          onChange={labels =>
            dispatch(setProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.labels, labels))
          }
        />

        <FormItem label={i18n.t('common.type')}>
          <ButtonGroup
            selectedItemKey={ProcessingStepCalculation.getType(calculation)}
            onChange={type =>
              dispatch(setProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.type, type))
            }
            items={types}
          />
        </FormItem>

        <FormItem label={i18n.t('processingStepCalculationView.attribute')}>
          <div className="processing-step-calculation__attribute-container">
            <Dropdown
              items={attributes}
              selection={attribute}
              itemKeyProp={ProcessingStepCalculation.keys.uuid}
              itemLabelFunction={attrDef =>
                `${NodeDef.getLabel(attrDef, i18n.lang)}${NodeDef.isAnalysis(attrDef) ? ' (c)' : ''}`
              }
              onChange={def => dispatch(setProcessingStepCalculationAttribute(NodeDef.getUuid(def)))}
              validation={Validation.getFieldValidation(ProcessingStepCalculation.keys.nodeDefUuid)(validation)}
            />
            <button className="btn btn-s btn-add" onClick={() => dispatch(createNodeDefAnalysis(history))}>
              <span className="icon icon-plus icon-12px icon-left" />
              {i18n.t('common.add')}
            </button>
          </div>
        </FormItem>

        {ProcessingStepCalculation.isQuantitative(calculation) && (
          <FormItem label={i18n.t('processingStepCalculationView.aggregateFunction')}>
            <ButtonGroup
              selectedItemKey={ProcessingStepCalculation.getAggregateFunction(calculation)}
              onChange={aggregateFn =>
                dispatch(setProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.aggregateFn, aggregateFn))
              }
              items={aggregateFns}
              deselectable={true}
            />
          </FormItem>
        )}

        <div className="button-bar">
          <button
            className="btn-s btn-cancel"
            onClick={() => (isDirty ? setShowCancelConfirm(true) : dispatch(resetProcessingStepCalculationState()))}
          >
            <span className="icon icon-cross icon-left icon-10px" />
            {i18n.t(isDirty ? 'common.cancel' : 'common.close')}
          </button>
          <button
            className="btn-s btn-primary"
            onClick={() => dispatch(saveProcessingStepCalculationEdits())}
            aria-disabled={!isDirty}
          >
            <span className="icon icon-floppy-disk icon-left icon-12px" />
            {i18n.t('common.save')}
          </button>
          <button
            className="btn-s btn-danger btn-delete"
            aria-disabled={ProcessingStepCalculation.isTemporary(calculation)}
            onClick={() => setShowDeleteConfirm(true)}
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
            dispatch(resetProcessingStepCalculationState())
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          message={i18n.t('processingStepCalculationView.deleteConfirm')}
          onOk={() => {
            setShowDeleteConfirm(false)
            dispatch(deleteProcessingStepCalculation())
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  ) : null
}

export default ProcessingStepCalculationEditor
