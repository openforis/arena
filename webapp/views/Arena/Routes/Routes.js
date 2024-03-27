import React, { Suspense, lazy } from 'react'
import { Route, Routes as RouterRoutes } from 'react-router-dom'

import * as User from '@core/user/user'

import { app, guest, noHeader } from '@webapp/app/appModules'
import { useUser } from '@webapp/store/user'
import { Fallback } from '@webapp/components/Fallback'

const Guest = lazy(() => import('../../Guest'))
const AppView = lazy(() => import('../../App'))
const NoHeaderView = lazy(() => import('../../NoHeader'))

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
            <Suspense fallback={<Fallback />}>
              <Guest />
            </Suspense>
          }
        />

        {user && User.hasAccepted(user) ? (
          <>
            <Route
              path={`/${noHeader}/*`}
              element={
                <Suspense fallback={<Fallback />}>
                  <NoHeaderView />
                </Suspense>
              }
            />
            <Route
              path={`/${app}/*`}
              element={
                <Suspense fallback={<Fallback />}>
                  <AppView />
                </Suspense>
              }
            />
          </>
        ) : (
          <Route
            path="*"
            element={
              <Suspense fallback={<Fallback />}>
                <Guest />
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
