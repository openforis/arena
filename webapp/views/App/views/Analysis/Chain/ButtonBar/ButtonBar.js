import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'

import * as API from '@webapp/service/api'
import { ChainActions, useChain, useChainEditLocked } from '@webapp/store/ui/chain'
import { Button, ButtonDelete, ButtonDownload } from '@webapp/components'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

const ButtonBar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyId = useSurveyId()
  const chain = useChain()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const canEditChain = useAuthCanUseAnalysis()
  const chainEditLocked = useChainEditLocked()

  const deleteChain = () => dispatch(ChainActions.deleteChain({ chain, navigate }))
  const toggleEditLock = () => dispatch(ChainActions.toggleEditLock)

  return (
    <div className="button-bar">
      <ButtonDownload
        className="chain-summary-download-btn"
        fileName="chain_summary.json"
        href={API.getChainSummaryExportUrl({ surveyId, chainUuid: Chain.getUuid(chain) })}
        label="chainView.downloadSummaryJSON"
        requestParams={{ cycle, lang }}
      />
      {canEditChain && (
        <Button
          iconClassName={chainEditLocked ? 'icon-lock' : 'icon-unlocked'}
          label={`chainView.${chainEditLocked ? 'unlock' : 'lock'}`}
          onClick={toggleEditLock}
          variant="text"
        />
      )}
      <ButtonDelete disabled={chainEditLocked} label="chainView.deleteChain" onClick={deleteChain} />
    </div>
  )
}

export default ButtonBar
