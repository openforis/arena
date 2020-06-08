import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { useI18n } from '@webapp/store/system'
import { createChain } from '@webapp/loggedin/modules/analysis/chains/actions'

const HeaderLeft = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  return (
    <button type="button" onClick={() => dispatch(createChain(history))} className="btn btn-s">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('common.new')}
    </button>
  )
}

export default HeaderLeft
