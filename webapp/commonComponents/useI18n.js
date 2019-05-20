import { useContext } from 'react'

import AppContext from '../app/appContext'

const useI18n = () => {
  const { i18n } = useContext(AppContext)
  return i18n
}

export default useI18n