import { useEffect, useState } from 'react'

import { isHexColor } from '@core/colorUtils'
import { escapeHtml } from '@core/stringUtils'

import { useI18n } from '@webapp/store/system'

/**
 * Builds the overlay name: Leaflet's layers control renders it as HTML, so the texts (survey labels) are escaped.
 * @param {object} params - Parameters.
 * @param {string} params.innerName - The layer label (plain text).
 * @param {string} [params.extraButtons] - HTML of the buttons after the label.
 * @param {string} params.colorPickerId - Id of the color input.
 * @param {string} [params.markersColor] - Initial color of the input (#rrggbb).
 * @param {string} params.changeMarkerColorTitle - Title of the color input (plain text).
 * @returns {string} The overlay name HTML.
 */
const buildLayerNameHtml = ({ innerName, extraButtons = '', colorPickerId, markersColor, changeMarkerColorTitle }) =>
  `<div class="layer-selector-row">
      <span class="layer-selector-button-bar">
        <input type="color" id="${colorPickerId}" value="${markersColor ?? ''}" class="layer-color-picker" title="${escapeHtml(changeMarkerColorTitle)}" />
      </span>
      <span class="layer-selector-name">${escapeHtml(innerName)}</span>
      <span class="layer-selector-button-bar">
        ${extraButtons}
      </span>
    </div>`

/**
 * Builds the overlay name with a color picker and tracks the color picked.
 * @param {object} params - Parameters.
 * @param {string} params.colorPickerId - Id of the color input.
 * @param {string} params.innerName - The layer label (plain text).
 * @param {string} [params.extraButtons] - HTML of the buttons after the label.
 * @param {string} [params.initialColor] - Initial markers color.
 * @returns {{layerName: string, currentMarkersColor: string|undefined}} The overlay name HTML and the current color.
 */
export const useLayerColorPicker = ({ colorPickerId, innerName, extraButtons, initialColor }) => {
  const i18n = useI18n()
  const changeMarkerColorTitle = i18n.t('mapView.changeMarkerColor')

  // the color also goes into HTML strings (layer name, cluster icons): keep only #rrggbb values
  const validInitialColor = isHexColor(initialColor) ? initialColor : undefined

  const [currentMarkersColor, setCurrentMarkersColor] = useState(validInitialColor)

  const layerName = buildLayerNameHtml({
    innerName,
    extraButtons,
    colorPickerId,
    markersColor: validInitialColor,
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
