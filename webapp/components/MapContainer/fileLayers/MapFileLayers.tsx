import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

import { useNotifyError } from '@webapp/components/hooks'

import { getReadErrorDetails, readFileLayerGroup } from '../workspace/uploaded/readUploadedFile'

export type MapFile = {
  // e.g. downloads a survey file or returns a dropped file
  getFile: () => Promise<File>
  // shown in a tooltip over the features of the file
  label?: string
}

type Props = {
  // read again when it changes: memoize it
  files: MapFile[]
}

const FIT_BOUNDS_OPTIONS: L.FitBoundsOptions = { padding: [32, 32], maxZoom: 16 }

/**
 * Shows KML, KMZ, zipped Shapefile or GeoJSON files on the map and zooms to them; files that cannot be read show an error.
 * @param {Props} props - The props.
 * @returns {null} Nothing: the layers are added to the Leaflet map.
 */
export const MapFileLayers = (props: Props): null => {
  const { files } = props

  const map = useMap()
  const notifyError = useNotifyError()

  useEffect(() => {
    let unmounted = false
    const groups: L.FeatureGroup[] = []

    const addFile = async ({ getFile, label }: MapFile): Promise<void> => {
      try {
        const group = await readFileLayerGroup(await getFile())
        if (unmounted) return
        if (label) group.bindTooltip(label, { sticky: true })
        group.addTo(map)
        groups.push(group)
      } catch (error) {
        if (!unmounted)
          notifyError({ key: 'mapWorkspace.upload.error', params: { details: getReadErrorDetails(error) } })
      }
    }

    void Promise.all(files.map(addFile)).then(() => {
      if (unmounted) return
      const bounds = L.latLngBounds([])
      for (const group of groups) bounds.extend(group.getBounds())
      if (bounds.isValid()) map.fitBounds(bounds, FIT_BOUNDS_OPTIONS)
    })

    return () => {
      unmounted = true
      for (const group of groups) group.remove()
    }
  }, [files, map, notifyError])

  return null
}
