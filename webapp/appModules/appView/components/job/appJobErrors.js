import React from 'react'
import * as R from 'ramda'

import {
  getJobErrors,
  isJobFailed,
} from '../../../../../common/job/job'

import { getValidationFieldMessagesHTML } from '../../../../appUtils/validationUtils'

const AppJobErrors = ({job}) => {

  const errors = getJobErrors(job)

  return isJobFailed(job)
    ? (
      <div className="app-job-monitor__errors">
        <div className="header">
          <div>Row</div>
          <div>Errors</div>
        </div>
        <div className="body">
          {
            R.keys(errors)
              .map(rowIndex =>
                <div key={rowIndex} className="row">
                  <div>
                    {1 + rowIndex}
                  </div>
                  <div>
                    {getValidationFieldMessagesHTML(errors[rowIndex])}
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
