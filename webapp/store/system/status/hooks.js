import * as R from 'ramda'

import { useSelector } from 'react-redux'

import * as StatusState from './state'

export const useIsReady = () => R.equals(useSelector(StatusState.getStatus), StatusState.appStatus.ready)
