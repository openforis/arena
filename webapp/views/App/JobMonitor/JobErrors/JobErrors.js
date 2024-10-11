import React from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'
import { ValidationUtils } from '@core/validation/validationUtils'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { ExpansionPanel } from '@webapp/components'
import ValidationFieldMessages from '@webapp/components/validationFieldMessages'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

const toValidation = (fields) => ({
  valid: false,
  fields,
})

const JobErrors = ({
  errorKeyHeaderName = 'common.item',
  exportFileName: exportFileNameProp,
  job = {},
  openPanel = true,
}) => {
  const errors = JobSerialized.getErrors(job)
  const errorsCount = JobSerialized.getErrorsCount(job)

  const i18n = useI18n()
  const survey = useSurvey()

  if (errorsCount === 0) return null

  const exportFileName = exportFileNameProp ? exportFileNameProp : `arena_${job.type}_errors`

  return (
    <ExpansionPanel buttonLabel="common.error_plural" className="app-job-monitor__job-errors" startClosed={!openPanel}>
      <DataGrid
        allowExportToCsv
        autoRowHeight
        columns={[
          {
            field: 'errorKey',
            flex: 0.4,
            headerName: i18n.t(errorKeyHeaderName),
            renderCell: ({ value }) => <LabelWithTooltip label={value} />,
          },
          {
            field: 'error',
            flex: 0.6,
            headerName: i18n.t('common.error', { count: errorsCount }),
            renderCell: ({ value }) => <ValidationFieldMessages validation={toValidation(value)} showKeys={false} />,
            valueFormatter: (value) => {
              const validation = toValidation(value)
              const jointMessages = ValidationUtils.getJointMessages({ i18n, survey, showKeys: false })(validation)
              return jointMessages.map(({ text }) => text).join(', ')
            },
          },
        ]}
        density="compact"
        exportFileName={exportFileName}
        rows={Object.entries(errors).map(([errorKey, error]) => ({ errorKey, error }))}
        getRowId={(row) => row.errorKey}
      />
    </ExpansionPanel>
  )
}

JobErrors.propTypes = {
  errorKeyHeaderName: PropTypes.string,
  exportFileName: PropTypes.string,
  job: PropTypes.object,
  openPanel: PropTypes.bool,
}

export default JobErrors
