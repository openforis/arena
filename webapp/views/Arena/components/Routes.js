import React from 'react'
import { Route, Switch } from 'react-router-dom'

import * as User from '@core/user/user'
import { app, guest } from '@webapp/app/appModules'

import { useUser } from '@webapp/components/hooks'

import DynamicImport from '@webapp/components/dynamicImport'
import AppLoaderView from '@webapp/app/appLoader/appLoaderView'
import AppDialogConfirm from '@webapp/app/appDialogConfirm/appDialogConfirm'
import AppNotificationView from '@webapp/app/appNotification/appNotificationView'
import Guest from '@webapp/views/Guest'

import { useWebSocket } from './useWebSocket'

const Routes = () => {
  const user = useUser()
  useWebSocket()

  return (
    <>
      <Switch>
        <Route path={`/${guest}`} component={Guest} />

        {user && User.hasAccepted(user) ? (
          <Route path={`/${app}`}>
            <DynamicImport load={() => import('@webapp/loggedin/appViewExport')} />
          </Route>
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
