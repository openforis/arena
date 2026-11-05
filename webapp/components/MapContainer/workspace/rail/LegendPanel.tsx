import React from 'react'
import type { ReactElement } from 'react'

import * as Survey from '@core/survey/survey'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'

import { useMapContextOptions } from '../../MapContext'
import { useMapCustomOverlays } from '../layers/MapCustomOverlaysContext'

/**
 * Legend tab: the symbols on the map, then the names of the added layers.
 * @returns {React.ReactElement} The panel.
 */
export const LegendPanel = (): ReactElement => {
  const t = useI18nT()
  const surveyInfo = useSurveyInfo()
  const options = useMapContextOptions()
  const { overlays } = useMapCustomOverlays()
  const showSamplingPolygon = Boolean(
    Survey.isSampleBasedImageInterpretationEnabled(surveyInfo) && options.showSamplingPolygon
  )
  return (
    <div className="map-legend">
      <ul className="map-legend__list">
        <li>
          <span className="map-legend__swatch map-legend__swatch--marker" aria-hidden="true" />
          {t('mapWorkspace.legend.marker')}
        </li>
        <li>
          <span className="map-legend__swatch map-legend__swatch--cluster" aria-hidden="true">
            5
          </span>
          {t('mapWorkspace.legend.cluster')}
        </li>
        {showSamplingPolygon && (
          <li>
            <span className="map-legend__swatch map-legend__swatch--polygon" aria-hidden="true" />
            {t('mapWorkspace.legend.samplingPolygon')}
          </li>
        )}
        {options.showUtmGrid && (
          <li>
            <span className="map-legend__swatch map-legend__swatch--grid" aria-hidden="true" />
            {t('mapWorkspace.legend.utmGrid')}
          </li>
        )}
      </ul>
      {overlays.length > 0 && (
        <>
          <h3 className="map-layers-panel__section-title">{t('mapWorkspace.legend.addedLayers')}</h3>
          <ul className="map-legend__list">
            {overlays.map((overlay) => (
              <li key={overlay.id}>
                <span className="map-legend__swatch map-legend__swatch--overlay" aria-hidden="true" />
                {overlay.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
