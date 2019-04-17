import React from 'react'
import * as R from 'ramda'

import { getValidationFieldMessagesHTML } from '../../utils/validationUtils'

const AppJobErrors = ({job}) => {

  const errors = R.propOr([], 'errors', job)

  return job.failed && !R.isEmpty(errors)
    ? (
      <div className="app-job-monitor__job-errors">
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
