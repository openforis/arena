import * as AppState from '@webapp/app/appState'
import { useSelector } from 'react-redux'

export default () => useSelector(AppState.getI18n)
