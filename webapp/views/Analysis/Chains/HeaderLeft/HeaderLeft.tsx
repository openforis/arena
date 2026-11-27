import { useState } from 'react'
import { useNavigate } from 'react-router'

import { AppIcon } from '@webapp/components/AppIcon'
import { useAppDispatch } from '@webapp/store'
import { useI18n } from '@webapp/store/system'
import { ChainActions } from '@webapp/store/ui/chain'
import { ChainCloneFromSurveyDialog } from '../ChainCloneFromSurveyDialog/ChainCloneFromSurveyDialog'

const HeaderLeft = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)

  const createChain = () => {
    dispatch(ChainActions.createChain({ navigate }))
  }

  return (
    <>
      <button className="btn btn-s" onClick={createChain} type="button">
        <AppIcon name="add" size={14} className="icon-left" />
        {i18n.t('common.new')}
      </button>
      <button className="btn btn-s" onClick={() => setCloneDialogOpen(true)} type="button">
        <AppIcon name="copy" size={14} className="icon-left" />
        {i18n.t('chainView.cloneFromAnotherSurvey')}
      </button>
      {cloneDialogOpen && <ChainCloneFromSurveyDialog onClose={() => setCloneDialogOpen(false)} />}
    </>
  )
}

export default HeaderLeft
