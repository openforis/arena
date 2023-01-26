import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'
import { ValidationUtils } from '@core/validation/validationUtils'

import { useI18n } from '@webapp/store/system'

import ValidationFieldMessages from '@webapp/components/validationFieldMessages'
import { DataGrid } from '@webapp/components/DataGrid'
import { useSurvey } from '@webapp/store/survey'
import { ExpansionPanel } from '@webapp/components'

const validationWrapper = (fields) => ({
  valid: false,
  fields,
})

const JobErrors = ({ job }) => {
  const errors = JobSerialized.getErrors(job)

  const i18n = useI18n()
  const survey = useSurvey()

  if (errors.length === 0) return null

  return (
    <div className="app-job-monitor__job-errors">
      <ExpansionPanel buttonLabel="common.error_plural" startClosed={JobSerialized.isRunning(job)}>
        <DataGrid
          allowExportToCsv
          autoPageSize
          columns={[
            { field: 'errorKey', headerName: i18n.t('common.item') },
            {
              field: 'error',
              flex: 1,
              headerName: i18n.t('common.error', { count: errors.length }),
              renderCell: ({ value }) => (
                <ValidationFieldMessages validation={validationWrapper(value)} showKeys={false} />
              ),
              valueFormatter: ({ value }) => {
                const jointMessages = ValidationUtils.getJointMessages({ i18n, survey, showKeys: false })(
                  validationWrapper(value)
                )
                return jointMessages.map(({ text }) => text).join(', ')
              },
            },
          ]}
          rows={Object.entries(errors).map(([errorKey, error]) => ({
            errorKey,
            error,
          }))}
          getRowId={(row) => row.errorKey}
        />
      </ExpansionPanel>
    </div>
  )
}

JobErrors.propTypes = {
  job: PropTypes.object,
}

JobErrors.defaultProps = {
  job: {},
}

export default JobErrors
