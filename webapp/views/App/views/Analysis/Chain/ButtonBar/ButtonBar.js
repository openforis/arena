import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'

import * as API from '@webapp/service/api'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { ButtonDelete, ButtonDownload } from '@webapp/components'
import { useSurveyId } from '@webapp/store/survey'

const ButtonBar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyId = useSurveyId()
  const chain = useChain()

  const deleteChain = () => dispatch(ChainActions.deleteChain({ chain, navigate }))

  return (
    <div className="button-bar">
      <ButtonDownload
        className="chain-summary-download-btn"
        label="chainView.downloadSummaryJSON"
        href={API.getChainSummaryExportUrl({ surveyId, chainUuid: Chain.getUuid(chain) })}
      />
      <ButtonDelete onClick={deleteChain} />
    </div>
  )
}

export default ButtonBar
