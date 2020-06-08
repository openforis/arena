import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useI18n } from '@webapp/components/hooks'
import * as AppState from '@webapp/app/appState'
import { initApp } from '@webapp/app/actions'

import Routes from './components/Routes'

const Arena = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const ready = useSelector(AppState.isReady)
  const systemError = useSelector(AppState.getSystemError)

  useEffect(() => {
    dispatch(initApp())
  }, [])

  if (!ready) return null

  if (systemError)
    return (
      <div className="main__system-error">
        <div className="main__system-error-container">
          <span className="icon icon-warning icon-24px icon-left" />
          {i18n.t('systemErrors.somethingWentWrong')}
          <div className="error">{systemError}</div>
        </div>
      </div>
    )

  return <Routes />
}

export default Arena
