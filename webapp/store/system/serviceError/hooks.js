import { useSelector } from 'react-redux'

import * as ServiceErrorState from './state'

export const useServiceErrors = () => useSelector(ServiceErrorState.getServiceErrors)
