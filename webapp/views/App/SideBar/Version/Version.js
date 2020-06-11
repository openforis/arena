import React from 'react'

import * as ProcessUtils from '@core/processUtils'

const Version = () => {
  return (
    <div className="version" data-commit-hash={ProcessUtils.ENV.gitCommitHash} data-branch={ProcessUtils.ENV.gitBranch}>
      OpenForis Arena
      <br />
      {ProcessUtils.ENV.applicationVersion}
    </div>
  )
}

export default Version
