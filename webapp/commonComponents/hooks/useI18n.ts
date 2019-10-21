import { useContext } from 'react'

import AppContext from '../../app/appContext'
import { AppI18n } from '../../app/appState'

export default () => {
  const { i18n } = useContext(AppContext)
  return i18n as unknown as AppI18n
}
