import React from 'react'
import { Route, Routes as RouterRoutes } from 'react-router-dom'

import * as User from '@core/user/user'
import { app, guest } from '@webapp/app/appModules'

import { useUser } from '@webapp/store/user'

import Guest from '@webapp/views/Guest'
const AppView = React.lazy(() => import('../../App'))

import { useWebSocket } from './useWebSocket'
import Loader from './Loader'
import DialogConfirm from './DialogConfirm'
import Notification from './Notification'

const Routes = () => {
  const user = useUser()
  useWebSocket()

  return (
    <>
      <RouterRoutes>
        <Route path={`/${guest}/*`} element={<Guest />} />
        {user && User.hasAccepted(user) ? (
          <Route
            path={`/${app}/*`}
            element={
              <React.Suspense fallback={<>...</>}>
                <AppView />
              </React.Suspense>
            }
          />
        ) : (
          <Route path="*" element={<Guest />} />
        )}
      </RouterRoutes>

      <Loader />
      <DialogConfirm />
      <Notification />
    </>
  )
}

export default Routes
