import { useCallback } from 'react'

import { State } from '../../state'

export const useResetItemActive = ({ setState }) =>
  useCallback(({ levelIndex }) => setState(State.dissocItemActive({ levelIndex })), [])
