import React from 'react'
import { useHistory } from 'react-router'

import { useI18n } from '@webapp/store/system'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'

const HeaderLeft = () => {
  const history = useHistory()
  const i18n = useI18n()

  const onClickNew = () => history.push(`${appModuleUri(analysisModules.processingChain)}`)

  return (
    <button type="button" onClick={onClickNew} className="btn btn-s">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.new')}
    </button>
  )
}

export default HeaderLeft
