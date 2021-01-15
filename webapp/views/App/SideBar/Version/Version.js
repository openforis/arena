import React from 'react'

import * as ProcessUtils from '@core/processUtils'

const Version = () => {
  return (
    <div
      className="version"
      data-commit-hash={ProcessUtils.ENV.applicationVersion}
      data-branch={ProcessUtils.ENV.applicationVersion}
    >
      OpenForis Arena
      <br />
      {ProcessUtils.ENV.applicationVersion}
    </div>
  )
}

export default Version
