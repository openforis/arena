import './Guest.scss'

import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import classNames from 'classnames'

import * as ProcessUtils from '@core/processUtils'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import { guestModules } from '@webapp/app/appModules'
import ResetPassword from '@webapp/views/Guest/views/ResetPassword'
import ForgotPassword from '@webapp/views/Guest/views/ForgotPassword'
import AccessRequest from '@webapp/views/Guest/views/AccessRequest'
import Login from '@webapp/views/Guest/views/Login'

import { GuestToolbar } from './GuestToolbar'
import { GuestBackground } from './components/GuestBackground'
import { GuestBrand } from './components/GuestBrand'
import { GuestFooter } from './components/GuestFooter'
import { GuestPitch } from './components/GuestPitch'

const getModules = (allowAccessRequest: boolean) => [
  { component: ResetPassword, path: `${guestModules.resetPassword.path}/*` },
  { component: ForgotPassword, path: `${guestModules.forgotPassword.path}/*` },
  ...(allowAccessRequest ? [{ component: AccessRequest, path: `${guestModules.accessRequest.path}/*` }] : []),
  // default to Login form
  { component: Login, path: '*' },
]

const Guest = () => {
  // re-render the guest views when the UI language changes
  useTranslation()
  const { pathname } = useLocation()
  const allowAccessRequest = Boolean(ProcessUtils.ENV.allowUserAccessRequest)
  const accessRequest = allowAccessRequest && pathname.includes(`/${guestModules.accessRequest.path}`)

  return (
    <div className="guest">
      <GuestBackground />
      <header className="guest__header">
        <GuestBrand />
        <GuestToolbar />
      </header>
      <main className={classNames('guest__main', { 'guest__main--wide': accessRequest })}>
        <GuestPitch accessRequest={accessRequest} />
        <div className="guest__card">
          <ModuleSwitch moduleDefault={guestModules.login} modules={getModules(allowAccessRequest)} />
        </div>
      </main>
      <GuestFooter />
    </div>
  )
}

export default Guest
