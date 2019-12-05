import * as AppState from '@webapp/app/appState'
import useStoreState from './useStoreState'

export default () => AppState.getI18n(useStoreState())
