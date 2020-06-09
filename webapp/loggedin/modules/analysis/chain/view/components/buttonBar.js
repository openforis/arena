import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useI18n } from '@webapp/store/system'
import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'

import { deleteChain, navigateToChainsView, saveChain } from '@webapp/loggedin/modules/analysis/chain/actions'
import { deleteStep } from '@webapp/loggedin/modules/analysis/step/actions'
import { deleteCalculation } from '@webapp/loggedin/modules/analysis/calculation/actions'

const ButtonBar = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const {
    chain,
    chainDirty,
    editingChain,
    step,
    editingStep,
    stepNext,
    calculation,
    editingCalculation,
    dirty,
  } = useChainEdit()

  return (
    <>
      <div className="button-bar">
        {editingChain && !editingStep && !editingCalculation && (
          <button
            type="button"
            className="btn-s btn-cancel"
            onClick={() =>
              chainDirty
                ? dispatch(
                    DialogConfirmActions.showDialogConfirm({
                      key: 'common.cancelConfirm',
                      onOk: navigateToChainsView(history),
                    })
                  )
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
          aria-disabled={!dirty}
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
            if (editingStep) messageKeyPrefix = 'processingStepView'
            if (editingCalculation) messageKeyPrefix = 'processingStepCalculationView'
            const messageKey = `${messageKeyPrefix}.deleteConfirm`

            let deleteAction = deleteChain(history)
            if (editingStep) deleteAction = deleteStep()
            if (editingCalculation) deleteAction = deleteCalculation()

            dispatch(DialogConfirmActions.showDialogConfirm({ key: messageKey, onOk: deleteAction }))
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
