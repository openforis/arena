import { ButtonDownload } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'

import { useSurveyId } from '@webapp/store/survey'

type HeaderLeftProps = {
  excludeResolved: boolean
  setExcludeResolved: (...args: any[]) => any
}

const HeaderLeft = (props: HeaderLeftProps) => {
  const { excludeResolved, setExcludeResolved } = props

  const surveyId = useSurveyId()

  return (
    <header>
      <Checkbox
        checked={excludeResolved}
        label="homeView:collectImportReport.excludeResolvedItems"
        onChange={(value) => setExcludeResolved(value)}
      />
      <ButtonDownload href={`/api/survey/${surveyId}/collect-import/report/export/`} label="common.exportToExcel" />
    </header>
  )
}

export default HeaderLeft
