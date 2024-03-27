import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { ExpansionPanel } from '@webapp/components'
import { SystemActions, useI18n, useSystemError, useSystemStatusReady } from '@webapp/store/system'

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
          <span className="error-message">
            <span className="icon icon-warning icon-24px icon-left" />
            {i18n.t('systemErrors.networkError')}
          </span>
          <span className="error-message__second-line">{i18n.t('systemErrors.sessionExpiredRefreshPage')}</span>
          <ExpansionPanel className="error-details-panel" buttonLabel="common.details" startClosed>
            <textarea className="error-details-textarea" rows={10} defaultValue={systemError} readOnly />
          </ExpansionPanel>
        </div>
      </div>
    )

  return <Routes />
}

export default Arena
