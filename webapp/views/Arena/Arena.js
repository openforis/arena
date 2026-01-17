import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import { SystemActions, useSystemError, useI18n, useSystemStatusReady } from '@webapp/store/system'
import { ExpansionPanel } from '@webapp/components'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

import Routes from './Routes'

const Arena = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const ready = useSystemStatusReady()
  const systemError = useSystemError()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if there's an authToken in the URL (from QR login redirect)
    const params = new URLSearchParams(location.search)
    const authToken = params.get('authToken')

    if (authToken) {
      // Set the auth token from QR login
      ApiConstants.setAuthToken(authToken)

      // Remove authToken from URL for security
      params.delete('authToken')
      const newSearch = params.toString()
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`
      navigate(newUrl, { replace: true })
    }

    dispatch(SystemActions.initSystem())
  }, [dispatch, location.pathname, location.search, navigate])

  if (!ready) return null

  if (systemError)
    return (
      <div className="main__system-error">
        <div className="main__system-error-container">
          <span className="error-message">
            <span className="icon icon-warning icon-24px icon-left" />
            {i18n.t('appErrors:networkError')}
          </span>
          <span className="error-message__second-line">{i18n.t('appErrors:sessionExpiredRefreshPage')}</span>
          <ExpansionPanel className="error-details-panel" buttonLabel="common.details" startClosed>
            <textarea className="error-details-textarea" rows={10} defaultValue={systemError} readOnly />
          </ExpansionPanel>
        </div>
      </div>
    )

  return <Routes />
}

export default Arena
