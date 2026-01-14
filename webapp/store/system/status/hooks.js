import { useSelector } from 'react-redux'

import * as SystemStatusState from './state'

export const useSystemStatusReady = () => useSelector(SystemStatusState.isReady)
