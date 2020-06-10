import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { SystemActions, useSystemError, useI18n, useSystemStatusReady } from '@webapp/store/system'

import Routes from './Routes'

const Arena = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const ready = useSystemStatusReady()
  const systemError = useSystemError()

  useEffect(() => {
    dispatch(SystemActions.initSystem())
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
