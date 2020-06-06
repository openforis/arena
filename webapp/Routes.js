import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Route } from 'react-router-dom'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { isGuestUri } from '@webapp/app/appModules'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import * as User from '@core/user/user'

import DynamicImport from '@webapp/components/dynamicImport'
import LoginView from '@webapp/guest/login/loginView'
import AppLoaderView from '@webapp/app/appLoader/appLoaderView'
import AppDialogConfirm from '@webapp/app/appDialogConfirm/appDialogConfirm'
import AppNotificationView from '@webapp/app/appNotification/appNotificationView'
import GuestView from '@webapp/guest/guestView'
import { useI18n, useOnUpdate } from '@webapp/components/hooks'

import * as AppState from '@webapp/app/appState'

import { initApp, throwSystemError } from '@webapp/app/actions'
import { activeJobUpdate } from '@webapp/loggedin/appJob/actions'

import { useUser } from '@webapp/components/hooks'

const Routes = props => {
    const dispatch = useDispatch()
    const user = useUser()
    const i18n = useI18n()
    const isReady =  useSelector(AppState.isReady)
    const systemError =  useSelector(AppState.getSystemError)

    const openSocket = () => {
        ;(async () => {
            await AppWebSocket.openSocket(error => dispatch(throwSystemError(error)))
            AppWebSocket.on(WebSocketEvents.jobUpdate, job => dispatch(activeJobUpdate(job)))
        })()
    }

    const closeSocket = () => {
        AppWebSocket.closeSocket()
        AppWebSocket.off(WebSocketEvents.jobUpdate)
    }

    useEffect(() => {
        dispatch(initApp())
        return closeSocket
    }, [])

    useOnUpdate(() => {
        if (isReady) {
            if (user) {
                openSocket()
            } else {
                closeSocket()
            }
        }
    }, [isReady, User.getUuid(user)])
    
    return systemError ? (
        <div className="main__system-error">
            <div className="main__system-error-container">
                <span className="icon icon-warning icon-24px icon-left" />
                {i18n && i18n.t('systemErrors.somethingWentWrong')}
                <div className="error">{systemError}</div>
            </div>
        </div>
    ) : (
        isReady && (
            <>
                {isGuestUri(location.pathname) ? (
                    <GuestView />
                ) : user && User.hasAccepted(user) ? (
                    <Route
                        path="/app"
                        render={props => <DynamicImport {...props} load={() => import('@webapp/loggedin/appViewExport')} />}
                    />
                ) : (
                    <LoginView />
                )}

                <AppLoaderView />
                <AppDialogConfirm />
                <AppNotificationView />
            </>
        )
    )
}

export default Routes
