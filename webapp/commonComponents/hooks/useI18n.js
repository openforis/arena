import { useSelector } from 'react-redux'

import * as AppState from '@webapp/app/appState'

export default () => useSelector(AppState.getI18n)
