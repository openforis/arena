import React from 'react'

import { useI18n } from '../../../../../commonComponents/hooks'

const ProcessingChainsHeaderLeft = ({ createProcessingChain, history }) => {
  const i18n = useI18n()

  return (
    <button onClick={() => createProcessingChain(history)} className="btn btn-s">
      <span className="icon icon-plus icon-12px icon-left"/>
      {i18n.t('common.new')}
    </button>
  )
}

export default ProcessingChainsHeaderLeft
