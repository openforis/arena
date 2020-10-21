import { useCallback } from 'react'

import { State } from '../../state'

export const useOpenEditor = ({ setState }) =>
  useCallback(({ variable }) => setState(State.assocVariablePrevStepEdit(variable)), [])
