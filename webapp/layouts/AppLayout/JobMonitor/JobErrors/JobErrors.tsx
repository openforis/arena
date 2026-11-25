import * as JobSerialized from '@common/job/jobSerialized'
import { ValidationUtils } from '@core/validation/validationUtils'
import { ExpansionPanel } from '@webapp/components'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import ValidationFieldMessages from '@webapp/components/ValidationFieldMessages'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { htmlToString } from '@webapp/utils/domUtils'

const toValidation = (fields) => ({
  valid: false,
  fields,
})

type JobErrorsProps = {
  errorKeyHeaderName?: string
  exportFileName?: string
  job?: Record<string, any>
  openPanel?: boolean
}

const JobErrors = ({
  errorKeyHeaderName = 'common.item',
  exportFileName: exportFileNameProp,
  job = {},
  openPanel = true,
}: JobErrorsProps) => {
  const errors = JobSerialized.getErrors(job)
  const errorsCount = JobSerialized.getErrorsCount(job)

  const i18n = useI18n()
  const survey = useSurvey()

  if (errorsCount === 0) return null

  const exportFileName = exportFileNameProp || `arena_${job.type}_errors`

  return (
    <ExpansionPanel buttonLabel="common.error_other" className="app-job-monitor__job-errors" startClosed={!openPanel}>
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
              return jointMessages.map(({ text }) => htmlToString(text)).join(', ')
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

export default JobErrors
