import React from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/store/system'
import { State } from '../store'

const ButtonBar = (props) => {
  const i18n = useI18n()

  const { state, Actions } = props
  // const { dirty } = State.get(state)

  const stepEdit = State.getChainEdit(state)
  const chainEdit = State.getChainEdit(state)
  const calculationEdit = State.getCalculationEdit(state)
  const stepNext = Chain.getStepNext(stepEdit)(chainEdit)

  const editingChain = Boolean(State.getChainEdit(state))
  const editingStep = Boolean(State.getStepEdit(state))
  const editingCalculation = Boolean(State.getCalculationEdit(state))
  const chainDirty = Boolean(State.isChainDirty(state))

  return (
    <>
      <div className="button-bar">
        {editingChain && !editingStep && !editingCalculation && (
          <button type="button" className="btn-s btn-cancel" onClick={() => Actions.dismiss({ state })}>
            <span className="icon icon-cross icon-left icon-10px" />
            {i18n.t(chainDirty ? 'common.cancel' : 'common.back')}
          </button>
        )}

        {/* <button type="button" className="btn-s btn-primary" onClick={Actions.save} aria-disabled={!dirty}>
          <span className="icon icon-floppy-disk icon-left icon-12px" />
          {i18n.t('common.save')}
        </button> */}
        <button
          type="button"
          className="btn-s btn-danger btn-delete"
          aria-disabled={
            (editingCalculation && Calculation.isTemporary(calculationEdit)) ||
            (editingStep && (Step.isTemporary(stepEdit) || Boolean(stepNext))) ||
            (editingChain && Chain.isTemporary(chainEdit))
          }
          onClick={() => {
            let deleteAction = Actions.delete
            if (editingStep) deleteAction = Actions.deleteStep
            if (editingCalculation) deleteAction = Actions.deleteCalculation
            deleteAction({ state })
          }}
        >
          <span className="icon icon-bin icon-left icon-12px" />
          {i18n.t('common.delete')}
        </button>
      </div>
    </>
  )
}

ButtonBar.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonBar
