import React, { useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import { type BaseLayerDef, defaultBaseLayer } from './baseLayers'
import { MapOptions } from './mapOptions'

const createInitialState = ({ sampleBasedImageInterpretationEnabled }) => ({
  baseLayer: null,
  options: MapOptions.createDefaultOptions({ sampleBasedImageInterpretationEnabled }),
})

type MapContextValue = {
  contextObject?: { baseLayer: BaseLayerDef | null; options: ReturnType<typeof MapOptions.createDefaultOptions> }
  onOptionUpdate?: (params: { option: string; value: unknown }) => void
  onBaseLayerUpdate?: (baseLayer: BaseLayerDef) => void
}

const MapContext = React.createContext<MapContextValue>({})

// Consumer
const MapContextConsumer = ({ children }) => <MapContext.Consumer>{(context) => children(context)}</MapContext.Consumer>

// Provider
const MapContextProvider = ({ children }) => {
  const survey = useSurvey()

  const sampleBasedImageInterpretationEnabled = Survey.isSampleBasedImageInterpretationEnabled(survey)
  const [contextObject, setContextObject] = useState(createInitialState({ sampleBasedImageInterpretationEnabled }))

  const onOptionUpdate = useCallback(
    ({ option, value }) =>
      setContextObject((contextPrev) => {
        const optionsPrev = contextPrev.options
        const optionsNext = MapOptions.assocOption({ option, value })(optionsPrev)
        return { ...contextPrev, options: optionsNext }
      }),
    []
  )

  const onBaseLayerUpdate = useCallback(
    (baseLayer) => setContextObject((contextPrev) => ({ ...contextPrev, baseLayer })),
    []
  )

  // Context values passed to consumer
  const value = useMemo(
    () => ({ contextObject, onOptionUpdate, onBaseLayerUpdate }),
    [contextObject, onBaseLayerUpdate, onOptionUpdate]
  )

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

const useMapContext = () => useContext(MapContext)

const useMapContextOptions = () => {
  const { contextObject } = useMapContext()
  const { options } = contextObject
  return options
}

const useMapContextBaseLayer = () => {
  const { contextObject } = useMapContext()
  const { baseLayer } = contextObject
  return baseLayer || defaultBaseLayer
}

export {
  MapContext,
  MapContextConsumer,
  MapContextProvider,
  useMapContext,
  useMapContextBaseLayer,
  useMapContextOptions,
}

MapContextConsumer.propTypes = {
  children: PropTypes.any,
}
MapContextProvider.propTypes = {
  children: PropTypes.any,
}
