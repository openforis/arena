import type { ReactElement } from 'react'
import { IconButton } from '@mui/material'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useMapCustomOverlays } from '../layers/MapCustomOverlaysContext'
import type { MapCustomOverlay } from '../layers/MapCustomOverlaysContext'

/**
 * Row of an added layer in the Layers tab: visibility, opacity and remove.
 * @param {object} props - Component props.
 * @param {MapCustomOverlay} props.overlay - The overlay.
 * @returns {React.ReactElement} The row.
 */
export const CustomOverlayRow = ({ overlay }: { overlay: MapCustomOverlay }): ReactElement => {
  const t = useI18nT()
  const { updateOverlay, removeOverlay } = useMapCustomOverlays()
  const { id, name, visible, opacity } = overlay
  // the name is user data: no HTML escaping in plain-text labels
  const nameParams = { name, interpolation: { escapeValue: false } }
  return (
    <div className="map-overlay-row" data-testid={TestId.mapWorkspace.overlayRow(id)}>
      <label className="map-overlay-row__name">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => updateOverlay(id, { visible: event.target.checked })}
        />
        <span title={name}>{name}</span>
      </label>
      <IconButton
        size="small"
        aria-label={t('mapWorkspace.layers.remove', nameParams)}
        onClick={() => removeOverlay(id)}
      >
        <span className="icon icon-10px icon-cross" aria-hidden="true" />
      </IconButton>
      <input
        className="map-overlay-row__opacity"
        type="range"
        min={5}
        max={100}
        step={5}
        value={Math.round(opacity * 100)}
        aria-label={t('mapWorkspace.layers.opacity', nameParams)}
        onChange={(event) => updateOverlay(id, { opacity: Number(event.target.value) / 100 })}
      />
    </div>
  )
}
