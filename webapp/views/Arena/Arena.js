import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ErrorBoundary } from 'react-error-boundary'
import PropTypes from 'prop-types'

import { SystemActions, useSystemError, useI18n, useSystemStatusReady } from '@webapp/store/system'
import { ExpansionPanel } from '@webapp/components'

import Routes from './Routes'

const ErrorFallback = ({ error }) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
  </div>
)

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
}

const Arena = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const ready = useSystemStatusReady()
  const systemError = useSystemError()

  useEffect(() => {
    dispatch(SystemActions.initSystem())
  }, [dispatch])

  const handleError = useCallback((error) => {
    // reload the page if the error is a chunk load error, which can happen when a new version of the app is deployed while the user has the app open
    if (error.name === 'ChunkLoadError' || /loading chunk/i.test(error.message)) {
      globalThis.location.reload()
    }
  }, [])

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

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <Routes />
    </ErrorBoundary>
  )
}

export default Arena
