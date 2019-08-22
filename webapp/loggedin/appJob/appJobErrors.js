import React from 'react'
import * as R from 'ramda'

import useI18n from '../../commonComponents/useI18n'

import { getValidationFieldMessagesHTML } from '../../utils/validationUtils'

const validationWrapper = fields => ({
  valid: false,
  fields,
})

const AppJobErrors = ({ job }) => {

  const errors = R.propOr([], 'errors', job)

  const i18n = useI18n()

  return job.failed && !R.isEmpty(errors)
    ? (
      <div className="app-job-monitor__job-errors">
        <div className="header">
          <div>{i18n.t('common.item')}</div>
          <div>{i18n.t('common.error', { count: errors.length })}</div>
        </div>
        <div className="body">
          {
            R.keys(errors)
              .map(errorKey =>
                <div key={errorKey} className="row">
                  <div className="item">
                    {i18n.t(errorKey)}
                  </div>
                  <div className="item-error">
                    {getValidationFieldMessagesHTML(i18n, null, false)(validationWrapper(errors[errorKey]))}
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
