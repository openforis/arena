import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as ServiceErrorState from './state'

export const useServiceErrors = () => useSelector(ServiceErrorState.getServiceErrors, Objects.isEqual)
