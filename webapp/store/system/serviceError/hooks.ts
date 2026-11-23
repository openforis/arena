import { useSelector } from 'react-redux'

import * as ServiceErrorState from './state'
import { Objects } from '@openforis/arena-core'

export const useServiceErrors = () => useSelector(ServiceErrorState.getServiceErrors, Objects.isEqual)
