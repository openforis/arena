import React from 'react'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'

const HeaderLeft = () => {
  const i18n = useI18n()

  return (
    <Link to={appModuleUri(analysisModules.processingChain)} className="btn btn-s">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.new')}
    </Link>
  )
}

export default HeaderLeft
