import React from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import ValidationFieldMessages from '@webapp/components/validationFieldMessages'

const validationWrapper = (fields) => ({
  valid: false,
  fields,
})

const JobErrors = ({ job }) => {
  const errors = JobSerialized.getErrors(job)

  const i18n = useI18n()

  return (
    JobSerialized.isFailed(job) &&
    !R.isEmpty(errors) && (
      <div className="app-job-monitor__job-errors">
        <div className="header">
          <div>{i18n.t('common.item')}</div>
          <div>{i18n.t('common.error', { count: errors.length })}</div>
        </div>
        <div className="body">
          {Object.entries(errors).map(([errorKey, error]) => (
            <div key={errorKey} className="row">
              <div className="item">{i18n.t(errorKey)}</div>
              <div className="item-error">
                <ValidationFieldMessages validation={validationWrapper(error)} showKeys={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  )
}

JobErrors.propTypes = {
  job: PropTypes.object,
}

JobErrors.defaultProps = {
  job: {},
}

export default JobErrors
