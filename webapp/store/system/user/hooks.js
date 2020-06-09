import { useSelector } from 'react-redux'

import * as UserState from './state'

export const useUser = () => useSelector(UserState.getUser)