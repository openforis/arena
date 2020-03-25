import React from 'react'

import * as ProcessUtils from '@core/processUtils'

const RStudioView = () => <iframe src={ProcessUtils.ENV.rStudioServerURL} style={{ height: '100%', width: '100%' }} />

export default RStudioView
