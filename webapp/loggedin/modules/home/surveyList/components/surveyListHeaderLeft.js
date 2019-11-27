import React from 'react'

import Header from '@webapp/commonComponents/header'
import {useI18n} from '@webapp/commonComponents/hooks'

const SurveyListHeaderLeft = () => {
  const i18n = useI18n()

  return (
    <Header>
      <h6>{i18n.t('appModules.surveyList')}</h6>
    </Header>
  )
}

export default SurveyListHeaderLeft
