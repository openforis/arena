import React from 'react'

import Dropdown from '@webapp/components/form/Dropdown'
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
 */
export const ScenesBandsControl = ({ bandMix, onChange }: ScenesBandsControlProps): React.ReactElement => {
  const t = useI18nT()
  const items = SCENE_BAND_MIXES.map((mix) => ({ value: mix, label: t(`mapWorkspace.scenes.bands.${mix}`) }))
  return (
    <div className="scenes-panel__field scenes-panel__bands">
      <label className="scenes-panel__label" htmlFor="scenes-panel-bands">
        {t('mapWorkspace.scenes.bands.label')}
      </label>
      <Dropdown
        className="scenes-panel__select"
        clearable={false}
        idInput="scenes-panel-bands"
        items={items}
        onChange={(item) => onChange(item.value)}
        searchable={false}
        selection={items.find((item) => item.value === bandMix)}
        testId={TestId.mapWorkspace.scenesBands}
      />
      <p className="scenes-panel__note">{t('mapWorkspace.scenes.bands.note')}</p>
    </div>
  )
}
