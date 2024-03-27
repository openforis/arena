import React from 'react'
import PropTypes from 'prop-types'

import { AppInfo } from '@core/app/appInfo'

import { useI18n } from '@webapp/store/system'

const iconByAppId = {
  [AppInfo.arenaAppId]: 'of_arena_icon.png',
  [AppInfo.arenaMobileId]: 'of_arena_mobile_icon.png',
}
const unknownAppIcon = 'question_mark_icon_20x20.png'

export const AppIcon = (props) => {
  const { appId, alt, style, title: titleProp } = props

  const i18n = useI18n()
  const icon = iconByAppId[appId] ?? unknownAppIcon
  const title = titleProp ?? i18n.t('common.createdWithApp', { app: AppInfo.getAppNameById(appId) })

  return <img className="app-icon" src={`/img/${icon}`} height={20} alt={alt} style={style} title={title} />
}

AppIcon.propTypes = {
  appId: PropTypes.string,
  alt: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.string,
}
