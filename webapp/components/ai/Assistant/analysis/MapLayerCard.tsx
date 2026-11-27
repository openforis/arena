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
  const { uuid, search } = model
  const key = uuid ?? 'location'
  return (
    <div className="ai-query-card" data-testid={TestId.aiMapLayerCard.root(key)}>
      <div className="ai-query-card__title">
        {model.label === null
          ? i18n.t('aiAnalysis.mapLayerCard.titleLocation')
          : i18n.t('aiAnalysis.mapLayerCard.title', { label: model.label, interpolation: { escapeValue: false } })}
      </div>
      {search && (
        <p className="ai-query-card__explanation">
          {i18n.t('aiAnalysis.mapLayerCard.search', { text: search, interpolation: { escapeValue: false } })}
        </p>
      )}
      <p className="ai-query-card__explanation">{model.explanation}</p>
      {model.status === 'noPermission' ? (
        <div className="ai-query-card--missing">{i18n.t('aiAnalysis.mapLayerCard.noPermission')}</div>
      ) : (
        <div className="ai-query-card__buttons">
          <Button
            className="btn-s"
            iconName="map"
            iconSize={18}
            label="aiAnalysis.mapLayerCard.showOnMap"
            onClick={() => void navigate(appModuleUri(dataModules.map), { state: { aiMapLayer: { uuid, search } } })}
            testId={TestId.aiMapLayerCard.showOnMap(key)}
            variant="outlined"
          />
        </div>
      )}
    </div>
  )
}
