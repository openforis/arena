import { Authorizer } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Survey from '@core/survey/survey'
import { ValidationUtils } from '@core/validation/validationUtils'
import { ButtonIconEditOrView } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import ValidationFieldMessages from '@webapp/components/ValidationFieldMessages'
import { useSurvey, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { AskAssistantButton } from './AskAssistantButton'

type RowProps = {
  item: Record<string, any>
  itemPosition: number
  onRowOpen: (...args: any[]) => any
  askAssistantAvailable?: boolean
}

const Row = (props: RowProps) => {
  const { item: row, itemPosition: rowNo, onRowOpen, askAssistantAvailable = false } = props

  const lang = useSurveyPreferredLang()
  const user = useUser()
  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  const path = RecordValidationReportItem.getPath({ survey, lang })(row)
  const ownerName = RecordValidationReportItem.getRecordOwnerName(row)
  const canEdit =
    Survey.isPublished(surveyInfo) &&
    Authorizer.canEditRecord(user, {
      [Record.keys.surveyUuid]: Survey.getUuid(surveyInfo),
      [Record.keys.uuid]: RecordValidationReportItem.getRecordUuid(row),
      [Record.keys.step]: RecordValidationReportItem.getRecordStep(row),
      [Record.keys.ownerUuid]: RecordValidationReportItem.getRecordOwnerUuid(row),
      [Record.keys.ownerName]: ownerName,
    })

  const validation = RecordValidationReportItem.getValidation(row)
  const jointValidationText = ValidationUtils.getJointMessage({ i18n, survey, showKeys: false })(validation)

  return (
    <>
      <div className="validation-report__row-num-col">{rowNo}</div>
      <div className="validation-report__path-col" data-value={path}>
        <LabelWithTooltip label={path} />
      </div>
      <div
        className="validation-report__message"
        data-testid={TestId.validationReport.cellMessages}
        data-value={jointValidationText}
      >
        <ValidationFieldMessages validation={validation} showKeys={false} showIcons />
      </div>
      <div className="validation-report__owner-col" data-value={ownerName}>
        <LabelWithTooltip label={ownerName} />
      </div>
      <div>
        <ButtonIconEditOrView canEdit={canEdit} onClick={() => onRowOpen(row)} />
      </div>
      {askAssistantAvailable && (
        <div>
          <AskAssistantButton row={row} />
        </div>
      )}
    </>
  )
}

export default Row
