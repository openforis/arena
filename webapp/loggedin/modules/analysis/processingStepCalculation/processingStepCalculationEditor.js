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

import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/actions'
import {
  updateProcessingStepCalculationProp,
  updateProcessingStepCalculationAttribute,
  resetProcessingStepCalculationState,
  createNodeDefAnalysis,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

import useProcessingStepCalculationEditorState from './useProcessingStepCalculationEditorState'

const ProcessingStepCalculationEditor = () => {
  const {
    i18n,

    surveyInfo,
    calculation,
    dirty,
    attributes,
    attribute,

    types,
    aggregateFns,

    showCancelConfirm,
    setShowCancelConfirm,
  } = useProcessingStepCalculationEditorState()

  const dispatch = useDispatch()
  const history = useHistory()

  const validation = ProcessingStepCalculation.getValidation(calculation)
  const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)

  return (
    <>
      <div className="processing-step__calculation-editor">
        <button
          className="btn-s btn-close"
          onClick={() => {
            if (dirty) {
              setShowCancelConfirm(true)
            } else {
              dispatch(resetProcessingStepCalculationState())
            }
          }}
        >
          <span className="icon icon-10px icon-cross" />
        </button>

        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingStepCalculation.getLabels(calculation)}
          onChange={labels =>
            dispatch(updateProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.labels, labels))
          }
        />

        <FormItem label={i18n.t('common.type')}>
          <ButtonGroup
            selectedItemKey={ProcessingStepCalculation.getType(calculation)}
            onChange={type =>
              dispatch(updateProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.type, type))
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
              itemLabelFunction={attrDef => NodeDef.getLabel(attrDef, i18n.lang)}
              onChange={def => dispatch(updateProcessingStepCalculationAttribute(NodeDef.getUuid(def)))}
              validation={Validation.getFieldValidation(ProcessingStepCalculation.keys.nodeDefUuid)(validation)}
            />
            <button
              className="btn btn-s btn-edit"
              onClick={() => dispatch(navigateToNodeDefEdit(history, nodeDefUuid))}
              aria-disabled={!nodeDefUuid}
            >
              <span className="icon icon-pencil2 icon-12px icon-left" />
              {i18n.t('common.edit')}
            </button>
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
                dispatch(
                  updateProcessingStepCalculationProp(ProcessingStepCalculation.keysProps.aggregateFn, aggregateFn),
                )
              }
              items={aggregateFns}
              deselectable={true}
            />
          </FormItem>
        )}
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
    </>
  )
}

export default ProcessingStepCalculationEditor
