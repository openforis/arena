import React, { Suspense } from 'react'
import { Route, Routes as RouterRoutes } from 'react-router'

import * as User from '@core/user/user'
import { app, guest, noHeader } from '@webapp/app/appModules'
import { useUser } from '@webapp/store/user'

const AppLayout = React.lazy(() => import('@webapp/layouts/AppLayout'))
const GuestLayout = React.lazy(() => import('@webapp/layouts/GuestLayout'))
const NoHeaderLayout = React.lazy(() => import('@webapp/layouts/NoHeaderLayout'))

import DialogConfirm from './DialogConfirm'
import Loader from './Loader'
import Notification from './Notification'
import { useOpenWebSocket } from './useOpenWebSocket'

const FallbackComponent = () => <>...</>

const Routes = () => {
  const user = useUser()
  useOpenWebSocket()

  return (
    <>
      <RouterRoutes>
        <Route
          path={`/${guest}/*`}
          element={
            <Suspense fallback={<FallbackComponent />}>
              <GuestLayout />
            </Suspense>
          }
        />
        <Route
          path={`/${noHeader}/*`}
          element={
            <Suspense fallback={<FallbackComponent />}>
              <NoHeaderLayout />
            </Suspense>
          }
        />
        {user && User.hasAccepted(user) ? (
          <Route
            path={`/${app}/*`}
            element={
              <Suspense fallback={<FallbackComponent />}>
                <AppLayout />
              </Suspense>
            }
          />
        ) : (
          <Route
            path="*"
            element={
              <Suspense fallback={<FallbackComponent />}>
                <GuestLayout />
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
