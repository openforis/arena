import './About.scss'

import React from 'react'

import * as ProcessUtils from '@core/processUtils'

import Markdown from '@webapp/components/markdown'
import { useI18n } from '@webapp/store/system'

export const About = () => {
  const i18n = useI18n()

  return (
    <Markdown
      className="about-container"
      source={i18n.t('helpView.about.text', { version: ProcessUtils.ENV.applicationVersion })}
    />
  )
}
