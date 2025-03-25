import React, { Suspense } from 'react'
import { Route, Routes as RouterRoutes } from 'react-router-dom'

import * as User from '@core/user/user'
import { app, guest, noHeader } from '@webapp/app/appModules'

import { useUser } from '@webapp/store/user'

const AppView = React.lazy(() => import('../../App'))
const Guest = React.lazy(() => import('../../Guest'))
const NoHeaderView = React.lazy(() => import('../../NoHeader'))

import { useOpenWebSocket } from './useOpenWebSocket'
import Loader from './Loader'
import DialogConfirm from './DialogConfirm'
import Notification from './Notification'

const Routes = () => {
  const user = useUser()
  useOpenWebSocket()

  return (
    <>
      <RouterRoutes>
        <Route
          path={`/${guest}/*`}
          element={
            <Suspense fallback={<>...</>}>
              <Guest />
            </Suspense>
          }
        />
        <Route
          path={`/${noHeader}/*`}
          element={
            <Suspense fallback={<>...</>}>
              <NoHeaderView />
            </Suspense>
          }
        />
        {user && User.hasAccepted(user) ? (
          <Route
            path={`/${app}/*`}
            element={
              <Suspense fallback={<>...</>}>
                <AppView />
              </Suspense>
            }
          />
        ) : (
          <Route
            path="*"
            element={
              <Suspense fallback={<>...</>}>
                <Guest />{' '}
              </Suspense>
            }
          />
        )}
      </RouterRoutes>

      <Loader />
      <DialogConfirm />
      <Notification />
    </>
  )
}

export default Routes
