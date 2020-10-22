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

  const chainEdit = State.getChainEdit(state)
  const stepEdit = State.getStepEdit(state)
  const calculationEdit = State.getCalculationEdit(state)
  const stepNext = Chain.getStepNext(stepEdit)(chainEdit)

  const editingChain = State.isEditingChain(state)
  const editingStep = State.isEditingStep(state)
  const editingCalculation = State.isEditingCalculation(state)
  const dirty = State.isDirty(state)

  return (
    <div className="button-bar">
      {editingChain && !editingStep && !editingCalculation && (
        <button type="button" className="btn-s btn-cancel" onClick={() => Actions.dismiss({ state })}>
          <span className="icon icon-cross icon-left icon-10px" />
          {i18n.t(dirty ? 'common.cancel' : 'common.back')}
        </button>
      )}

      <button
        type="button"
        className="btn-s btn-primary"
        onClick={() => Actions.save({ state })}
        aria-disabled={!dirty}
      >
        <span className="icon icon-floppy-disk icon-left icon-12px" />
        {i18n.t('common.save')}
      </button>
      <button
        type="button"
        className="btn-s btn-danger btn-delete"
        aria-disabled={
          (editingCalculation && Calculation.isTemporary(calculationEdit)) ||
          (editingStep && !editingCalculation && (Step.isTemporary(stepEdit) || Boolean(stepNext))) ||
          (editingChain && !editingStep && !editingCalculation && Chain.isTemporary(chainEdit))
        }
        onClick={() => {
          let deleteAction
          if (editingCalculation) deleteAction = Actions.deleteCalculation
          else if (editingStep) deleteAction = Actions.deleteStep
          else deleteAction = Actions.delete
          deleteAction({ state })
        }}
      >
        <span className="icon icon-bin icon-left icon-12px" />
        {i18n.t('common.delete')}
      </button>
    </div>
  )
}

ButtonBar.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonBar
