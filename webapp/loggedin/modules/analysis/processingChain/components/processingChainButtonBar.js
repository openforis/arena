import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'

import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import {
  deleteProcessingChain,
  navigateToProcessingChainsView,
} from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { deleteProcessingStep } from '@webapp/loggedin/modules/analysis/processingStep/actions'
import {
  deleteProcessingStepCalculation,
  resetProcessingStepCalculationState,
  saveProcessingStepCalculationEdits,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const ProcessingChainButtonBar = props => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const chain = useSelector(ProcessingChainState.getProcessingChain)
  const chainDirty = useSelector(ProcessingChainState.isDirty)
  const editingChain = useSelector(ProcessingChainState.isEditingChain)

  const step = useSelector(ProcessingStepState.getProcessingStep)
  const stepDirty = false // UseSelector(ProcessingStepState.getProcessingStep) TODO
  const editingStep = useSelector(ProcessingStepState.isEditingStep)

  const calculation = useSelector(ProcessingStepCalculationState.getCalculationDirty)
  const calculationDirty = useSelector(ProcessingStepCalculationState.isDirty)
  const editingCalculation = useSelector(ProcessingStepCalculationState.isEditingCalculation)

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <>
      <div className="button-bar">
        {editingChain && !editingStep && !editingCalculation && (
          <button
            className="btn-s btn-cancel"
            onClick={() =>
              chainDirty ? setShowCancelConfirm(true) : dispatch(navigateToProcessingChainsView(history))
            }
          >
            <span className="icon icon-cross icon-left icon-10px" />
            {i18n.t(chainDirty ? 'common.cancel' : 'common.back')}
          </button>
        )}

        <button
          className="btn-s btn-primary"
          // OnClick={() => dispatch(saveProcessingStepCalculationEdits())}
          // aria-disabled={!isDirty}
          aria-disabled={
            (editingCalculation && !calculationDirty) || (editingStep && !stepDirty) || (editingChain && !chainDirty)
          }
        >
          <span className="icon icon-floppy-disk icon-left icon-12px" />
          {i18n.t('common.save')}
        </button>
        <button
          className="btn-s btn-danger btn-delete"
          aria-disabled={
            (editingCalculation && ProcessingStepCalculation.isTemporary(calculation)) ||
            (editingStep && ProcessingStep.isTemporary(step)) ||
            (editingChain && ProcessingChain.isTemporary(chain))
          }
          onClick={() => setShowDeleteConfirm(true)}
        >
          <span className="icon icon-bin icon-left icon-12px" />
          {i18n.t('common.delete')}
        </button>
      </div>

      {showCancelConfirm && (
        <ConfirmDialog
          message={i18n.t('common.cancelConfirm')}
          onOk={() => {
            setShowCancelConfirm(false)
            dispatch(navigateToProcessingChainsView(history))
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          message={i18n.t(
            `${
              editingCalculation
                ? 'processingStepCalculationView'
                : editingStep
                ? 'processingStepView'
                : 'processingChainView'
            }.deleteConfirm`,
          )}
          onOk={() => {
            setShowDeleteConfirm(false)
            if (editingCalculation) {
              dispatch(deleteProcessingStepCalculation())
            } else if (editingStep) {
              dispatch(deleteProcessingStep())
            } else {
              dispatch(deleteProcessingChain(history))
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

export default ProcessingChainButtonBar
