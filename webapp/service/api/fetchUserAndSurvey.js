import axios from 'axios'

import analytics from '@webapp/service/analytics'
import { AppInfo } from '@core/app/appInfo'

export const fetchUserAndSurvey = async () => {
  const appInfo = AppInfo.newAppInfo()
  analytics.event({
    name: 'user_fetch',
    params: { appId: AppInfo.getAppId(appInfo), appVersion: AppInfo.getVersion(appInfo) },
  })

  const {
    data: { user, survey },
  } = await axios.get('/auth/user')
  return { user, survey }
}
