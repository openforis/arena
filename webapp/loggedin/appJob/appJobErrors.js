import React from 'react'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import { getValidationFieldMessagesHTML } from '@webapp/utils/validationUtils'

const validationWrapper = fields => ({
  valid: false,
  fields,
})

const AppJobErrors = ({ job }) => {
  const errors = R.propOr([], 'errors', job)

  const i18n = useI18n()

  return job.failed && !R.isEmpty(errors) ? (
    <div className="app-job-monitor__job-errors">
      <div className="header">
        <div>{i18n.t('common.item')}</div>
        <div>{i18n.t('common.error', { count: errors.length })}</div>
      </div>
      <div className="body">
        {Object.entries(errors).map(([errorKey, error]) => (
          <div key={errorKey} className="row">
            <div className="item">{i18n.t(errorKey)}</div>
            <div className="item-error">{getValidationFieldMessagesHTML(i18n, false)(validationWrapper(error))}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null
}

export default AppJobErrors
