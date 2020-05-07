import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'
import { deleteChain, navigateToChainsView, saveChain } from '@webapp/loggedin/modules/analysis/chain/actions'
import { deleteStep } from '@webapp/loggedin/modules/analysis/step/actions'
import { deleteStepCalculation } from '@webapp/loggedin/modules/analysis/calculation/actions'

const ButtonBar = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const chain = useSelector(ChainState.getProcessingChain)
  const chainDirty = useSelector(ChainState.isDirty)
  const editingChain = useSelector(ChainState.isEditingChain)

  const step = useSelector(StepState.getProcessingStep)
  const stepNext = useSelector(StepState.getProcessingStepNext)
  const stepDirty = useSelector(StepState.isDirty)
  const editingStep = useSelector(StepState.isEditingStep)

  const calculation = useSelector(CalculationState.getCalculation)
  const calculationDirty = useSelector(CalculationState.isDirty)
  const editingCalculation = useSelector(CalculationState.isEditingCalculation)

  return (
    <>
      <div className="button-bar">
        {editingChain && !editingStep && !editingCalculation && (
          <button
            type="button"
            className="btn-s btn-cancel"
            onClick={() =>
              chainDirty
                ? dispatch(showDialogConfirm('common.cancelConfirm', {}, navigateToChainsView(history)))
                : dispatch(navigateToChainsView(history))
            }
          >
            <span className="icon icon-cross icon-left icon-10px" />
            {i18n.t(chainDirty ? 'common.cancel' : 'common.back')}
          </button>
        )}

        <button
          type="button"
          className="btn-s btn-primary"
          onClick={() => dispatch(saveChain())}
          aria-disabled={!calculationDirty && !stepDirty && !chainDirty}
        >
          <span className="icon icon-floppy-disk icon-left icon-12px" />
          {i18n.t('common.save')}
        </button>
        <button
          type="button"
          className="btn-s btn-danger btn-delete"
          aria-disabled={
            (editingCalculation && Calculation.isTemporary(calculation)) ||
            (editingStep && (Step.isTemporary(step) || Boolean(stepNext))) ||
            (editingChain && Chain.isTemporary(chain))
          }
          onClick={() => {
            let messageKeyPrefix = 'processingChainView'
            if (editingCalculation) messageKeyPrefix = 'processingStepCalculationView'
            if (editingStep) messageKeyPrefix = 'processingStepView'
            const messageKey = `${messageKeyPrefix}.deleteConfirm`

            let deleteAction = deleteChain(history)
            if (editingCalculation) deleteAction = deleteStepCalculation()
            if (editingStep) deleteAction = deleteStep()

            dispatch(showDialogConfirm(messageKey, {}, deleteAction))
          }}
        >
          <span className="icon icon-bin icon-left icon-12px" />
          {i18n.t('common.delete')}
        </button>
      </div>
    </>
  )
}

export default ButtonBar
