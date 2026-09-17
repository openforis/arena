import PropTypes from 'prop-types'

import { AppInfo } from '@core/app/appInfo'
import { useI18n } from '@webapp/store/system'

const iconNameByAppId = {
  [AppInfo.arenaAppId]: 'laptop',
  [AppInfo.arenaMobileId]: 'mobile',
  [AppInfo.arenaMobile2Id]: 'mobile2',
}
const unknownAppIconName = 'question'

export const AppIcon = (props) => {
  const { appId, alt, style, title: titleProp } = props

  const i18n = useI18n()
  const iconName = iconNameByAppId[appId] ?? unknownAppIconName
  const title = titleProp ?? i18n.t('common.createdWithApp', { app: AppInfo.getAppNameById(appId) })

  return <span className={`app-icon icon icon-20px icon-${iconName}`} aria-label={alt} style={style} title={title} />
}

AppIcon.propTypes = {
  appId: PropTypes.string,
  alt: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.string,
}
