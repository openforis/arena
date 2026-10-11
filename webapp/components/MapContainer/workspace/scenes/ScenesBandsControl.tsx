import React from 'react'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { SceneBandMix } from './sceneTypes'
import { SCENE_BAND_MIXES } from './sceneUrls'

type ScenesBandsControlProps = { bandMix: SceneBandMix; onChange: (bandMix: SceneBandMix) => void }

/**
 * Band mix used by new scene layers, with the note that three-file mixes load more slowly.
 *
 * @param {object} props - Props.
 * @param {SceneBandMix} props.bandMix - Selected band mix.
 * @param {Function} props.onChange - Called with the new band mix.
 * @returns {React.ReactElement} The control.
 */
export const ScenesBandsControl = ({ bandMix, onChange }: ScenesBandsControlProps): React.ReactElement => {
  const t = useI18nT()
  return (
    <div className="scenes-panel__field scenes-panel__bands">
      <label className="scenes-panel__label" htmlFor="scenes-panel-bands">
        {t('mapWorkspace.scenes.bands.label')}
      </label>
      <select
        id="scenes-panel-bands"
        className="scenes-panel__select"
        value={bandMix}
        onChange={(event) => onChange(event.target.value as SceneBandMix)}
        data-testid={TestId.mapWorkspace.scenesBands}
      >
        {SCENE_BAND_MIXES.map((mix) => (
          <option key={mix} value={mix}>
            {t(`mapWorkspace.scenes.bands.${mix}`)}
          </option>
        ))}
      </select>
      <p className="scenes-panel__note">{t('mapWorkspace.scenes.bands.note')}</p>
    </div>
  )
}
