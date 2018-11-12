import React from 'react'
import * as R from 'ramda'

import {
  getJobErrors,
  isJobFailed,
} from '../../../../../common/job/job'

import { getValidationFieldMessagesHTML } from '../../../../appUtils/validationUtils'

const AppJobErrors = ({job}) => {

  const errors = getJobErrors(job)

  return isJobFailed(job) && !R.isEmpty(errors)
    ? (
      <div className="app-job-monitor__errors">
        <div className="header">
          <div>Item</div>
          <div>Errors</div>
        </div>
        <div className="body">
          {
            R.keys(errors)
              .map(errorKey =>
                <div key={errorKey} className="row">
                  <div>
                    {errorKey}
                  </div>
                  <div>
                    {getValidationFieldMessagesHTML(errors[errorKey])}
                  </div>
                </div>
              )
          }
        </div>
      </div>
    )
    : null

}

export default AppJobErrors
