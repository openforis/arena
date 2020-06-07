import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Route, Switch } from 'react-router-dom'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { app, guest } from '@webapp/app/appModules'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import * as User from '@core/user/user'

import { useOnUpdate } from '@webapp/components/hooks'
import DynamicImport from '@webapp/components/dynamicImport'
import AppLoaderView from '@webapp/app/appLoader/appLoaderView'
import AppDialogConfirm from '@webapp/app/appDialogConfirm/appDialogConfirm'
import AppNotificationView from '@webapp/app/appNotification/appNotificationView'
import Guest from '@webapp/views/Guest'

import { throwSystemError } from '@webapp/app/actions'
import { activeJobUpdate } from '@webapp/loggedin/appJob/actions'

import { useUser } from '@webapp/components/hooks'

const Routes = () => {
  const dispatch = useDispatch()
  const user = useUser()

  const openSocket = () => {
    ;(async () => {
      await AppWebSocket.openSocket((error) => dispatch(throwSystemError(error)))
      AppWebSocket.on(WebSocketEvents.jobUpdate, (job) => dispatch(activeJobUpdate(job)))
    })()
  }

  const closeSocket = () => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate)
  }

  useEffect(() => {
    return closeSocket
  }, [])

  useOnUpdate(() => {
    if (user) {
      openSocket()
    } else {
      closeSocket()
    }
  }, [User.getUuid(user)])

  return (
    <>
      <Switch>
        <Route path={`/${guest}`} component={Guest} />

        {user && User.hasAccepted(user) ? (
          <Route
            path={`/${app}`}
            render={(props) => <DynamicImport {...props} load={() => import('@webapp/loggedin/appViewExport')} />}
          />
        ) : (
          <Route component={Guest} />
        )}
      </Switch>

      <AppLoaderView />
      <AppDialogConfirm />
      <AppNotificationView />
    </>
  )
}

export default Routes
