import { useSelector } from 'react-redux'

import * as AppSavingState from './state'

export const useIsAppSaving = () => useSelector(AppSavingState.isSaving)
