import React from 'react'

import * as ProcessUtils from '@core/processUtils'

import { useI18n } from '@webapp/store/system'

const Version = () => {
  const i18n = useI18n()

  return (
    <div
      className="version"
      data-commit-hash={ProcessUtils.ENV.applicationVersion}
      data-branch={ProcessUtils.ENV.applicationVersion}
    >
      {i18n.t('common.appNameFull')}
      <br />
      {ProcessUtils.ENV.applicationVersion}
    </div>
  )
}

export default Version
