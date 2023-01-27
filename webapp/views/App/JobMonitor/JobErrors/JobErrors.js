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

const JobErrors = ({ job, openPanel }) => {
  const errors = JobSerialized.getErrors(job)

  const i18n = useI18n()
  const survey = useSurvey()

  if (errors.length === 0) return null

  return (
    <ExpansionPanel buttonLabel="common.error_plural" className="app-job-monitor__job-errors" startClosed={!openPanel}>
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
  job: PropTypes.object,
  openPanel: PropTypes.bool,
}

JobErrors.defaultProps = {
  job: {},
  openPanel: true,
}

export default JobErrors
