import type { ReactElement } from 'react'
import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'

import { groupOverlays } from '../layers/customOverlays'
import { useMapCustomOverlays } from '../layers/MapCustomOverlaysContext'
import { useMapWorkspace } from '../MapWorkspaceContext'
import { CustomOverlayRow } from './CustomOverlayRow'

/**
 * Layers tab: the survey data overlays (the Leaflet layers control moved here), then the added layers by group.
 * @param {object} props - Component props.
 * @param {number} props.dataLayersCount - Number of survey data layers.
 * @returns {React.ReactElement} The panel.
 */
export const LayersPanel = ({ dataLayersCount }: { dataLayersCount: number }): ReactElement => {
  const t = useI18nT()
  const { setLayersControlTarget } = useMapWorkspace()
  const { overlays } = useMapCustomOverlays()
  const empty = dataLayersCount === 0
  return (
    <div className="map-layers-panel">
      {empty && <p className="map-layers-panel__empty">{t('mapWorkspace.layers.noSurveyData')}</p>}
      <div
        ref={setLayersControlTarget}
        className={classNames('map-layers-panel__control', { 'map-layers-panel__control--empty': empty })}
      />
      {groupOverlays(overlays).map(({ group, overlays: groupItems }) => (
        <section key={group} className="map-layers-panel__group">
          <h3 className="map-layers-panel__section-title">{t(`mapWorkspace.layers.groups.${group}`)}</h3>
          {groupItems.map((overlay) => (
            <CustomOverlayRow key={overlay.id} overlay={overlay} />
          ))}
        </section>
      ))}
    </div>
  )
}
