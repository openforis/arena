import { useContext } from 'react'

import AppContext from '../../app/appContext'

export default () => {
  const { i18n } = useContext(AppContext)
  return i18n
}