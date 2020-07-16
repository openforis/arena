import { useCallback } from 'react'

import { State } from '../state'

export const useSetItemActive = ({ setState }) =>
  useCallback(({ levelIndex, itemUuid }) => setState(State.assocLevelActiveItem({ levelIndex, itemUuid })), [])
