import { useEffect, useState } from 'react'

import { useI18n } from '@webapp/store/system'

const buildLayerNameHtml = ({ innerName, extraButtons = '', colorPickerId, markersColor, changeMarkerColorTitle }) =>
  `<div class="layer-selector-row">
      <span class="layer-selector-name">${innerName}</span>
      <span class="layer-selector-button-bar">
        <input type="color" id="${colorPickerId}" value="${markersColor}" class="layer-color-picker" title="${changeMarkerColorTitle}" />
        ${extraButtons}
      </span>
    </div>`

export const useLayerColorPicker = ({ colorPickerId, innerName, extraButtons, initialColor }) => {
  const i18n = useI18n()
  const changeMarkerColorTitle = i18n.t('mapView.changeMarkerColor')

  const [currentMarkersColor, setCurrentMarkersColor] = useState(initialColor)

  const layerName = buildLayerNameHtml({
    innerName,
    extraButtons,
    colorPickerId,
    markersColor: initialColor,
    changeMarkerColorTitle,
  })

  const colorPickerInput = document.getElementById(colorPickerId)

  useEffect(() => {
    if (!colorPickerInput) return
    const onColorInput = (e) => setCurrentMarkersColor(e.target.value)
    colorPickerInput.addEventListener('input', onColorInput)
    return () => colorPickerInput.removeEventListener('input', onColorInput)
  }, [colorPickerInput])

  return { layerName, currentMarkersColor }
}
