import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { useI18n } from '@webapp/store/system'
import { ChainActions } from '@webapp/store/ui/chain'
import { DataTestId } from '@webapp/utils/dataTestId'
import * as NodeDef from '@core/survey/nodeDef'

const HeaderLeft = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  const createVirtualEntity = () => {
    dispatch(ChainActions.createNodeDef({ history, type: NodeDef.nodeDefType.entity, virtual: true }))
  }

  return (
    <button data-testid={DataTestId.entities.addBtn} className="btn btn-s" onClick={createVirtualEntity} type="button">
      <span className="icon icon-plus icon-12px icon-left" />
      {i18n.t('processingChainView.entities.new')}
    </button>
  )
}

export default HeaderLeft
