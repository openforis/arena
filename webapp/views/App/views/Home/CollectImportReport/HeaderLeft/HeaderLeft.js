import React from 'react'

import Header from '@webapp/components/header'
import { ButtonDownload } from '@webapp/components/buttons'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const HeaderLeft = () => {
  const surveyId = useSurveyId()
  const i18n = useI18n()

  return (
    <Header>
      <ButtonDownload
        href={`/api/survey/${surveyId}/collect-import/report/export/`}
        label={i18n.t('common.csvExport')}
      />
    </Header>
  )
}

export default HeaderLeft
