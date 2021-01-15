import { useCallback } from 'react'

import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'
import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useUpdateProps = ({ setState }) =>
  useCallback(({ props, state }) => {
    const chain = State.getChainEdit(state)
    const step = State.getStepEdit(state)
    const newProps = {
      [Step.keysProps.categoryUuid]: null,
      [Step.keysProps.entityUuid]: null,
      ...props,
    }
    const { chain: chainUpdated, step: stepUpdated } = ChainController.mergeStepProps({
      chain,
      step,
      props: newProps,
    })
    const stateUpdated = A.pipe(State.assocChainEdit(chainUpdated), State.assocStepEdit(stepUpdated))(state)
    setState(stateUpdated)
    return stateUpdated
  }, [])
