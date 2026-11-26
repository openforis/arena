import { AppInfo } from '@core/app/appInfo'
import { useI18n } from '@webapp/store/system'

const iconNameByAppId = {
  [AppInfo.arenaAppId]: 'laptop',
  [AppInfo.arenaMobileId]: 'mobile',
  [AppInfo.arenaMobile2Id]: 'mobile2',
}
const unknownAppIconName = 'question'

type CreatedWithAppIconProps = {
  appId?: string
  alt?: string
  style?: Record<string, any>
  title?: string
}

export const CreatedWithAppIcon = (props: CreatedWithAppIconProps) => {
  const { appId, alt, style, title: titleProp } = props

  const i18n = useI18n()
  const iconName = iconNameByAppId[appId] ?? unknownAppIconName
  const title = titleProp ?? i18n.t('common.createdWithApp', { app: AppInfo.getAppNameById(appId) })

  return (
    <span
      className={`created-with-app-icon icon icon-20px icon-${iconName}`}
      aria-label={alt}
      style={style}
      title={title}
    />
  )
}
