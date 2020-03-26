import React from 'react'

import * as ProcessUtils from '@core/processUtils'

const RStudioView = () => {
  const rStudioServerUrl = ProcessUtils.ENV.rStudioServerURL || `${location.origin}/rstudio/`
  return <iframe src={rStudioServerUrl} style={{ height: '100%', width: '100%' }} />
}

export default RStudioView
