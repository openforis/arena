import './About.scss'

import React, { useEffect, useState } from 'react'

import * as ProcessUtils from '@core/processUtils'

import Markdown from '@webapp/components/markdown'
import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'

const initialVersion = ProcessUtils.ENV.applicationVersion

export const About = () => {
  const i18n = useI18n()
  const [version, setVersion] = useState(initialVersion)

  useEffect(() => {
    const fetchVersion = async () => {
      setVersion(await API.fetchVersion())
    }
    if (!initialVersion) {
      fetchVersion()
    }
  }, [])

  return <Markdown className="about-container" source={i18n.t('helpView.about.text', { version })} />
}
