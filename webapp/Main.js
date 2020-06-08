import './utils/polyfill/polyfill'
import './style/main.scss'

import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { useI18n } from '@webapp/components/hooks'
import Routes from '@webapp/Routes'
import * as AppState from '@webapp/app/appState'
import { ErrorState } from '@webapp/store/app/error'
import { initApp } from '@webapp/app/actions'
import { store } from '@webapp/store/store'

const Arena = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const ready = useSelector(AppState.isReady)
  const systemError = useSelector(ErrorState.getSystemError)

  useEffect(() => {
    dispatch(initApp())
  }, [])

  if (!ready) return null

  if (systemError)
    return (
      <div className="main__system-error">
        <div className="main__system-error-container">
          <span className="icon icon-warning icon-24px icon-left" />
          {i18n && i18n.t('systemErrors.somethingWentWrong')}
          <div className="error">{systemError}</div>
        </div>
      </div>
    )

  return <Routes />
}

function renderApp() {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <Arena />
      </BrowserRouter>
    </Provider>,
    document.querySelector('#main')
  )
}

renderApp()
