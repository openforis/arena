import { useEffect } from 'react'
import PropTypes from 'prop-types'

const GROUP_LABEL_CLASS = 'leaflet-control-layers-group-label'

/**
 * Injects styled group-label divs into the Leaflet layers control DOM.
 * Must be rendered as a sibling of (and after) the LayersControl component so that
 * Leaflet has already created the overlays DOM by the time this component's effect runs.
 * @param {object} props - Component props.
 * @param {L.Control.Layers|null} props.control - The layers control (its DOM may have been moved out of the map).
 * @param {string} [props.baseLayersLabel] - Label to prepend to the base layers section.
 * @param {Array<{label: string, count: number}>} [props.overlayGroups] - Overlay groups in display order.
 * @returns {null} Renders nothing.
 */
export const MapLayersGroupsInjector = ({ control, baseLayersLabel, overlayGroups = [] }) => {
  const groupsKey = JSON.stringify(overlayGroups)

  useEffect(() => {
    const container = control?.getContainer()
    if (!container) return undefined
    const injected = []

    const injectLabel = (label, referenceNode, parentNode) => {
      const el = document.createElement('div')
      el.className = GROUP_LABEL_CLASS
      el.textContent = label
      if (referenceNode) {
        referenceNode.before(el)
      } else {
        parentNode.appendChild(el)
      }
      injected.push(el)
    }

    if (baseLayersLabel) {
      const baseList = container.querySelector('.leaflet-control-layers-base')
      if (baseList) {
        injectLabel(baseLayersLabel, baseList.firstChild, baseList)
      }
    }

    const overlaysList = container.querySelector('.leaflet-control-layers-overlays')
    if (overlaysList && overlayGroups.length > 0) {
      let offset = 0
      for (const group of overlayGroups) {
        if (group.count > 0) {
          injectLabel(group.label, overlaysList.children[offset])
          offset += group.count + 1 // +1 to account for the header we just inserted
        }
      }
    }

    return () => {
      injected.forEach((el) => el.remove())
    }
    // groupsKey is a stable serialisation of overlayGroups used as dep to avoid object reference churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control, baseLayersLabel, groupsKey])

  return null
}

MapLayersGroupsInjector.propTypes = {
  control: PropTypes.object,
  baseLayersLabel: PropTypes.string,
  overlayGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
