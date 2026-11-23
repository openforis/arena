import { useDispatch } from 'react-redux'

import type { AppDispatch } from './store'

// dispatch accepting the thunks (actions returning functions) too
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
