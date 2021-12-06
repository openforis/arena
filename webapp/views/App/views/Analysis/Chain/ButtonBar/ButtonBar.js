import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

const ButtonBar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const chain = useChain()

  const deleteChain = () => dispatch(ChainActions.deleteChain({ chain, navigate }))

  return (
    <div className="button-bar">
      <button type="button" className="btn-s btn-danger btn-delete" onClick={deleteChain}>
        <span className="icon icon-bin icon-left icon-12px" />
        {i18n.t('common.delete')}
      </button>
    </div>
  )
}

export default ButtonBar
