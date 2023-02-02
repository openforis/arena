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

const JobErrors = ({ errorKeyHeaderName, job, openPanel }) => {
  const errors = JobSerialized.getErrors(job)
  const errorsCount = JobSerialized.getErrorsCount(job)

  const i18n = useI18n()
  const survey = useSurvey()

  if (errorsCount === 0) return null

  return (
    <ExpansionPanel buttonLabel="common.error_plural" className="app-job-monitor__job-errors" startClosed={!openPanel}>
      <DataGrid
        allowExportToCsv
        autoPageSize
        columns={[
          { field: 'errorKey', flex: 0.3, headerName: i18n.t(errorKeyHeaderName) },
          {
            field: 'error',
            flex: 0.7,
            headerName: i18n.t('common.error', { count: errorsCount }),
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
        density="compact"
        initialState={{
          sorting: {
            sortModel: [{ field: 'errorKey', sort: 'asc' }],
          },
        }}
        rows={Object.entries(errors).map(([errorKey, error]) => ({
          errorKey,
          error,
        }))}
        getRowClassName={() => 'error-item'}
        getRowId={(row) => row.errorKey}
      />
    </ExpansionPanel>
  )
}

JobErrors.propTypes = {
  errorKeyHeaderName: PropTypes.string,
  job: PropTypes.object,
  openPanel: PropTypes.bool,
}

JobErrors.defaultProps = {
  errorKeyHeaderName: 'common.item',
  job: {},
  openPanel: true,
}

export default JobErrors
