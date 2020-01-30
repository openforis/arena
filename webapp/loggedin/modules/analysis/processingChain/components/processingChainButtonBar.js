import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import {
  saveProcessingChain,
  deleteProcessingChain,
  navigateToProcessingChainsView,
} from '@webapp/loggedin/modules/analysis/processingChain/actions'
import { deleteProcessingStep } from '@webapp/loggedin/modules/analysis/processingStep/actions'
import { deleteProcessingStepCalculation } from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const ProcessingChainButtonBar = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const chain = useSelector(ProcessingChainState.getProcessingChain)
  const chainDirty = useSelector(ProcessingChainState.isDirty)
  const editingChain = useSelector(ProcessingChainState.isEditingChain)

  const step = useSelector(ProcessingStepState.getProcessingStep)
  const stepNext = useSelector(ProcessingStepState.getProcessingStepNext)
  const stepDirty = useSelector(ProcessingStepState.isDirty)
  const editingStep = useSelector(ProcessingStepState.isEditingStep)

  const calculation = useSelector(ProcessingStepCalculationState.getCalculation)
  const calculationDirty = useSelector(ProcessingStepCalculationState.isDirty)
  const editingCalculation = useSelector(ProcessingStepCalculationState.isEditingCalculation)

  return (
    <>
      <div className="button-bar">
        {editingChain && !editingStep && !editingCalculation && (
          <button
            className="btn-s btn-cancel"
            onClick={() =>
              chainDirty
                ? dispatch(showDialogConfirm('common.cancelConfirm', {}, navigateToProcessingChainsView(history)))
                : dispatch(navigateToProcessingChainsView(history))
            }
          >
            <span className="icon icon-cross icon-left icon-10px" />
            {i18n.t(chainDirty ? 'common.cancel' : 'common.back')}
          </button>
        )}

        <button
          className="btn-s btn-primary"
          onClick={() => dispatch(saveProcessingChain())}
          aria-disabled={!calculationDirty && !stepDirty && !chainDirty}
        >
          <span className="icon icon-floppy-disk icon-left icon-12px" />
          {i18n.t('common.save')}
        </button>
        <button
          className="btn-s btn-danger btn-delete"
          aria-disabled={
            (editingCalculation && ProcessingStepCalculation.isTemporary(calculation)) ||
            (editingStep && (ProcessingStep.isTemporary(step) || Boolean(stepNext))) ||
            (editingChain && ProcessingChain.isTemporary(chain))
          }
          onClick={() => {
            const messageKeyConfirm = `${
              editingCalculation
                ? 'processingStepCalculationView'
                : editingStep
                ? 'processingStepView'
                : 'processingChainView'
            }.deleteConfirm`

            const onDeleteConfirm = editingCalculation
              ? deleteProcessingStepCalculation()
              : editingStep
              ? deleteProcessingStep()
              : deleteProcessingChain(history)

            dispatch(showDialogConfirm(messageKeyConfirm, {}, onDeleteConfirm))
          }}
        >
          <span className="icon icon-bin icon-left icon-12px" />
          {i18n.t('common.delete')}
        </button>
      </div>
    </>
  )
}

export default ProcessingChainButtonBar
