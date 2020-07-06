import { useCallback } from 'react'
import * as R from 'ramda'

import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { State } from '../state'

export const useMoveCalculation = ({ setState }) =>
  useCallback(({ indexFrom, indexTo, state }) => {
    const step = State.getStepEdit(state)
    const calculations = Step.getCalculations(step)
    const calculationsMoved = R.move(indexFrom, indexTo, calculations || [])
    const calculationsUpdate = calculationsMoved.map((calculation, idx) => Calculation.assocIndex(idx)(calculation))
    const stepUpdated = Step.assocCalculations(calculationsUpdate)(step)

    setState(State.assocStepEdit(stepUpdated)(state))
  }, [])
