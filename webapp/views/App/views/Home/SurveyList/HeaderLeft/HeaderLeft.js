import React from 'react'

import { useI18n } from '@webapp/store/system'

import Header from '@webapp/components/header'

const HeaderLeft = () => {
  const i18n = useI18n()

  return (
    <Header>
      <h6>{i18n.t('appModules.surveyList')}</h6>
    </Header>
  )
}

export default HeaderLeft
