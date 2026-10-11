// side effect: defines L.control.ruler and loads its CSS (the package exports only its root)
import 'react-leaflet-ruler'

import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

import { useMapWorkspace } from '../MapWorkspaceContext'

type RulerControl = L.Control & { isActive: () => boolean; _toggleMeasure: () => void }
type RulerFactory = (options: { events: { onToggle: (active: boolean) => void } }) => RulerControl

/**
 * Runs the react-leaflet-ruler measuring while mounted; its button is hidden, the top bar starts and stops it.
 * @returns {null} Renders nothing.
 */
export const RulerBridge = (): null => {
  const map = useMap()
  const { dispatch } = useMapWorkspace()

  useEffect(() => {
    let disposing = false
    // the plugin enables double click zoom when it stops; the Arena maps keep it disabled
    const doubleClickZoomEnabled = map.doubleClickZoom.enabled()
    const createRuler = (L.control as unknown as { ruler: RulerFactory }).ruler
    const ruler = createRuler({
      events: {
        // Escape with no point measured stops the plugin: end the tool in the workspace too
        onToggle: (active) => {
          if (!active && !disposing) dispatch({ type: 'endTool' })
        },
      },
    })
    map.addControl(ruler)
    ruler._toggleMeasure()
    return () => {
      disposing = true
      if (ruler.isActive()) ruler._toggleMeasure()
      if (!doubleClickZoomEnabled) map.doubleClickZoom.disable()
      map.removeControl(ruler)
    }
  }, [dispatch, map])

  return null
}
