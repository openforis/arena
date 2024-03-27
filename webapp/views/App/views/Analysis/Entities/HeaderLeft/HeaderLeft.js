import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { ChainActions } from '@webapp/store/ui/chain'
import { TestId } from '@webapp/utils/testId'

const HeaderLeft = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()

  const createVirtualEntity = () => {
    dispatch(ChainActions.createNodeDef({ navigate, type: NodeDef.nodeDefType.entity, virtual: true }))
  }

  return (
    <button data-testid={TestId.entities.addBtn} className="btn btn-s" onClick={createVirtualEntity} type="button">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('chainView.entities.new')}
    </button>
  )
}

export default HeaderLeft
