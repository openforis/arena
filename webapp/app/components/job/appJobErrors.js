import React from 'react'
import * as R from 'ramda'

import {
  getJobErrors,
  isJobFailed,
} from '../../../../common/job/job'

const ErrorMessage = ({error}) => {
  const fields = R.keys(error)

  return <span>
  {
    fields.map(
      (field, i) => <React.Fragment key={i}>
        <span>
          {field}:{' '}
          {
            R.pipe(
              R.path([field, 'errors']),
              R.join(', ')
            )(error)
          }
          </span>
        {
          i !== fields.length - 1 &&
          <br/>
        }
      </React.Fragment>
    )
  }
</span>
}

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
                    <ErrorMessage error={errors[rowIndex]}/>
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
