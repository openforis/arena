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
  const { chain, dirty, step, editingChain, editingStep, calculation, editingCalculation } = State.get(state)

  const stepNext = Chain.getStepNext(step)(chain)

  return (
    <>
      <div className="button-bar">
        {editingChain && !editingStep && !editingCalculation && (
          <button type="button" className="btn-s btn-cancel" onClick={Actions.dismiss}>
            <span className="icon icon-cross icon-left icon-10px" />
            {i18n.t(dirty ? 'common.cancel' : 'common.back')}
          </button>
        )}

        <button type="button" className="btn-s btn-primary" onClick={Actions.save} aria-disabled={!dirty}>
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
            let deleteAction = Actions.chain.delete
            if (editingStep) deleteAction = Actions.step.delete
            if (editingCalculation) deleteAction = Actions.calculation.delete
            deleteAction()
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
