import './processingStepView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as Validation from '@core/validation/validation'

import { useI18n, useOnUpdate } from '@webapp/commonComponents/hooks'
import EntitySelector from './components/entitySelector'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'
import ProcessingStepCalculationsList from './components/processingStepCalculationsList'
import ProcessingStepCalculationEditor from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationEditor'
import CategorySelector from '@webapp/loggedin/surveyViews/categorySelector/categorySelector'

import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/actions'
import {
  fetchProcessingStepData,
  resetProcessingStepState,
  updateProcessingStepProps,
  addEntityVirtual,
  validateProcessingStep,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    processingStep,
    validation,
    processingStepPrev,
    processingStepNext,
    dirty,
    editingCalculation,
    fetchProcessingStepData,
    validateProcessingStep,
    resetProcessingStepState,
    updateProcessingStepProps,
    addEntityVirtual,
    navigateToNodeDefEdit,
  } = props

  const history = useHistory()

  const hasCalculationSteps = R.pipe(ProcessingStep.getCalculationsCount, cnt => cnt > 0)(processingStep)
  const disabledEntityOrCategory = hasCalculationSteps || editingCalculation || Boolean(processingStepNext)
  const entityUuid = ProcessingStep.getEntityUuid(processingStep)

  const i18n = useI18n()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    if (!editingCalculation) {
      fetchProcessingStepData()
    }
  }, [ProcessingStep.getUuid(processingStep)])

  useOnUpdate(() => {
    // Validate step on calculation editor close (calculations may have been added / deleted)
    if (!editingCalculation) {
      validateProcessingStep()
    }
  }, [editingCalculation])

  return (
    <div className={`processing-step${editingCalculation ? ' calculation-editor-opened' : ''}`}>
      <div className="form">
        {!editingCalculation && (
          <>
            <button
              className="btn-s btn-close"
              onClick={() => {
                if (dirty) {
                  setShowCancelConfirm(true)
                } else {
                  resetProcessingStepState()
                }
              }}
            >
              <span className="icon icon-10px icon-cross" />
            </button>

            <EntitySelector
              processingStep={processingStep}
              processingStepPrev={processingStepPrev}
              showLabel={!editingCalculation}
              validation={Validation.getFieldValidation(ProcessingStep.keysProps.entityUuid)(validation)}
              onChange={entityUuid => {
                const props = {
                  [ProcessingStep.keysProps.entityUuid]: entityUuid,
                  [ProcessingStep.keysProps.categoryUuid]: null,
                }
                updateProcessingStepProps(props)
              }}
              readOnly={disabledEntityOrCategory}
            >
              <button
                className="btn btn-s btn-edit"
                onClick={() => navigateToNodeDefEdit(history, entityUuid)}
                aria-disabled={!entityUuid}
              >
                <span className="icon icon-pencil2 icon-12px icon-left" />
                {i18n.t('common.edit')}
              </button>
              <button
                className="btn btn-s btn-add"
                onClick={() => addEntityVirtual(history)}
                aria-disabled={hasCalculationSteps}
              >
                <span className="icon icon-plus icon-12px icon-left" />
                {i18n.t('processingStepView.virtualEntity')}
              </button>
            </EntitySelector>

            <div className={`form-item${editingCalculation ? '' : ' processing-step__category-selector-form-item'}`}>
              <div className="form-label processing-chain__steps-label">{i18n.t('nodeDefEdit.codeProps.category')}</div>
              <CategorySelector
                disabled={disabledEntityOrCategory}
                categoryUuid={ProcessingStep.getCategoryUuid(processingStep)}
                validation={null}
                showManage={false}
                onChange={category => {
                  const props = {
                    [ProcessingStep.keysProps.entityUuid]: null,
                    [ProcessingStep.keysProps.categoryUuid]: Category.getUuid(category),
                  }
                  updateProcessingStepProps(props)
                }}
              />
            </div>
          </>
        )}
        <ProcessingStepCalculationsList
          processingStep={processingStep}
          calculationEditorOpened={editingCalculation}
          validation={Validation.getFieldValidation(ProcessingStep.keys.calculations)(validation)}
        />
      </div>

      <ProcessingStepCalculationEditor />

      {showCancelConfirm && (
        <ConfirmDialog
          message={i18n.t('common.cancelConfirm')}
          onOk={() => {
            setShowCancelConfirm(false)
            resetProcessingStepState()
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}

const mapStateToProps = state => {
  const processingChain = ProcessingChainState.getProcessingChain(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const validation = ProcessingChain.getItemValidationByUuid(ProcessingStep.getUuid(processingStep))(processingChain)

  return {
    processingStep,
    validation,
    processingStepPrev: ProcessingStepState.getProcessingStepPrev(state),
    processingStepNext: ProcessingStepState.getProcessingStepNext(state),
    dirty: ProcessingStepState.isDirty(state),
    editingCalculation: ProcessingStepCalculationState.isEditingCalculation(state),
  }
}

export default connect(mapStateToProps, {
  fetchProcessingStepData,
  validateProcessingStep,
  resetProcessingStepState,
  updateProcessingStepProps,
  addEntityVirtual,
  navigateToNodeDefEdit,
})(ProcessingStepView)
