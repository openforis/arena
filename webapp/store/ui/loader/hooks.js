import { useSelector } from 'react-redux'

import * as LoaderState from './state'

export const useLoader = () => useSelector(LoaderState.isVisible)
