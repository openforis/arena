import { AppInfo } from '@core/app/appInfo'
import { AppIcon, IconName } from '@webapp/components/AppIcon'
import { useI18n } from '@webapp/store/system'

const iconNameByAppId: Record<string, IconName> = {
  [AppInfo.arenaAppId]: 'laptop',
  [AppInfo.arenaMobileId]: 'mobileOld',
  [AppInfo.arenaMobile2Id]: 'mobile',
}
const unknownAppIconName: IconName = 'help'

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
    <AppIcon aria-label={alt} className="created-with-app-icon" name={iconName} size={20} style={style} title={title} />
  )
}
