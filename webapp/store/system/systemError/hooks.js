import { useSelector } from 'react-redux'

import * as SystemErrorState from './state'

export const useSystemError = () => useSelector(SystemErrorState.getSystemError)
