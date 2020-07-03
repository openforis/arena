import { useCallback } from 'react'

import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'
import * as Chain from '@common/analysis/processingChain'

import { State } from '../../state'

export const useUpdateProps = ({ setState }) =>
  useCallback(({ props, state }) => {
    const stepUpdated = Step.mergeProps(props)(State.getStepEdit(state))
    const chainUpdated = Chain.assocProcessingStep(stepUpdated)(State.getChainEdit(state))

    setState(A.pipe(State.assocChainEdit(chainUpdated), State.assocStepEdit(stepUpdated))(state))
  }, [])
