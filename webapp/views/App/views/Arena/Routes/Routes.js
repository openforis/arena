import React from 'react'
import { Route, Switch } from 'react-router-dom'

import * as User from '@core/user/user'
import { app, guest } from '@webapp/app/appModules'

import { useUser } from '@webapp/store/user'

import DynamicImport from '@webapp/components/dynamicImport'
import Guest from '@webapp/views/App/views/Guest'

import { useWebSocket } from './useWebSocket'
import Loader from './Loader'
import DialogConfirm from './DialogConfirm'
import Notification from './Notification'

const Routes = () => {
  const user = useUser()
  useWebSocket()

  return (
    <>
      <Switch>
        <Route path={`/${guest}`} component={Guest} />

        {user && User.hasAccepted(user) ? (
          <Route path={`/${app}`}>
            <DynamicImport load={() => import('@webapp/views/App/appExport')} />
          </Route>
        ) : (
          <Route component={Guest} />
        )}
      </Switch>

      <Loader />
      <DialogConfirm />
      <Notification />
    </>
  )
}

export default Routes
