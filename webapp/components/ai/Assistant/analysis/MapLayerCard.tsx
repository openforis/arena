import './QueryCard.scss'

import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import type { ProposedMapLayer } from '@webapp/ai/tools/analysis/proposeMapLayer'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components/buttons'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'
import { TestId } from '@webapp/utils/testId'

import { getMapLayerCardModel } from './mapLayerCardModel'

/**
 * Card of a map layer proposed by the assistant, with the button that shows it on the Map.
 * @param {object} props - Props.
 * @param {ProposedMapLayer} props.proposed - The proposed layer.
 * @returns {React.ReactElement} The card.
 */
export const MapLayerCard = ({ proposed }: { proposed: ProposedMapLayer }) => {
  const navigate = useNavigate()
  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const canUseMap = useAuthCanUseMap()
  const model = useMemo(
    () => getMapLayerCardModel({ proposed, survey, lang, canUseMap }),
    [proposed, survey, lang, canUseMap]
  )

  if (model.status === 'missing') {
    return <div className="ai-query-card ai-query-card--missing">{i18n.t('aiAnalysis.mapLayerCard.missing')}</div>
  }
  const { uuid } = model
  return (
    <div className="ai-query-card" data-testid={TestId.aiMapLayerCard.root(uuid)}>
      <div className="ai-query-card__title">{i18n.t('aiAnalysis.mapLayerCard.title', { label: model.label })}</div>
      <p className="ai-query-card__explanation">{model.explanation}</p>
      {model.status === 'noPermission' ? (
        <div className="ai-query-card--missing">{i18n.t('aiAnalysis.mapLayerCard.noPermission')}</div>
      ) : (
        <div className="ai-query-card__buttons">
          <Button
            className="btn-s"
            iconClassName="icon-map icon-12px"
            label="aiAnalysis.mapLayerCard.showOnMap"
            onClick={() => void navigate(appModuleUri(dataModules.map), { state: { aiMapLayer: { uuid } } })}
            testId={TestId.aiMapLayerCard.showOnMap(uuid)}
            variant="outlined"
          />
        </div>
      )}
    </div>
  )
}
