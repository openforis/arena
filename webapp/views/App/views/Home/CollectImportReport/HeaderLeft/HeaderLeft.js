import React from 'react'

import Header from '@webapp/components/header'
import { ButtonDownload } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const HeaderLeft = (props) => {
  const { excludeResolved, setExcludeResolved } = props

  const surveyId = useSurveyId()
  const i18n = useI18n()

  return (
    <Header>
      <h6>{i18n.t('homeView.collectImportReport.title')}</h6>
      <FormItem className="exclude-resolved" label={i18n.t('homeView.collectImportReport.excludeResolvedItems')}>
        <Checkbox checked={excludeResolved} onChange={(value) => setExcludeResolved(value)} />
      </FormItem>
      <ButtonDownload href={`/api/survey/${surveyId}/collect-import/report/export/`} label="common.csvExport" />
    </Header>
  )
}

export default HeaderLeft
