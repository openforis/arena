import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import { useI18n } from '@webapp/store/system'
import { ChainActions } from '@webapp/store/ui/chain'

import { ChainCloneFromSurveyDialog } from '../ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog'

const HeaderLeft = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)

  const createChain = () => {
    dispatch(ChainActions.createChain({ navigate }))
  }

  return (
    <>
      <button className="btn btn-s" onClick={createChain} type="button">
        <span className="icon icon-plus icon-12px icon-left" />
        {i18n.t('common.new')}
      </button>
      <button className="btn btn-s" onClick={() => setCloneDialogOpen(true)} type="button">
        <span className="icon icon-copy icon-12px icon-left" />
        {i18n.t('chainView.cloneFromAnotherSurvey')}
      </button>
      {cloneDialogOpen && <ChainCloneFromSurveyDialog onClose={() => setCloneDialogOpen(false)} />}
    </>
  )
}

export default HeaderLeft
