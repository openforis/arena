import { useEffect, useMemo, useRef, useState } from 'react'
import type L from 'leaflet'

import { getScaleBar, metersPerPixel } from '@webapp/components/MapContainer/workspace/statusbar/mapScale'
import {
  captureMapAtPlot,
  captureMapView,
  hasMaplibreLayer,
  isMapHidden,
  type MapCaptureResult,
} from '@webapp/components/MapContainer/workspace/screenshot/mapCapture'
import { getCaptureNotice } from '@webapp/components/MapContainer/workspace/screenshot/screenshotCaptureRules'
import { canvasToBlob, composeScreenshot } from '@webapp/components/MapContainer/workspace/screenshot/screenshotCompose'
import { errorToText } from '@webapp/components/MapContainer/workspace/screenshot/screenshotSave'
import {
  buildStampLines,
  formatStampCoordinates,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotStamp'
import type {
  LatLngLiteral,
  ScreenshotFormat,
  ScreenshotNotice,
  ScreenshotOptions,
  ScreenshotPlotCandidate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

const SCALE_BAR_MAX_WIDTH_PX = 100

export type ScreenshotStamp = {
  plotLabel: string | null
  plotPoint: LatLngLiteral | null
  dateText: string
  baseMapName: string
  attributions: string[]
}

export type ScreenshotPreview = {
  blob: Blob | null
  url: string | null
  loading: boolean
  notice: ScreenshotNotice | null
  errorDetails: string | null
}

type CaptureState = {
  result: MapCaptureResult | null
  loading: boolean
  errorDetails: string | null
  maplibre: boolean
  hidden: boolean
}

type CaptureRequest = { map: L.Map; includeData: boolean; plotKey: string | null; fitZoom: number }

type FinishedCapture = { request: CaptureRequest | null; result: MapCaptureResult | null; errorDetails: string | null }

type ComposedImage = { blob: Blob | null; url: string | null; composing: boolean; errorDetails: string | null }

type ComposeRequest = {
  capture: MapCaptureResult
  format: ScreenshotFormat
  markCenter: boolean
  includeScale: boolean
  includeStamp: boolean
  stamp: ScreenshotStamp
}

type FinishedImage = {
  request: ComposeRequest | null
  blob: Blob | null
  url: string | null
  errorDetails: string | null
}

const NO_IMAGE: ComposedImage = { blob: null, url: null, composing: false, errorDetails: null }

/**
 * Stage 1: captures the map again when the capture mode, the plot (fit to plot only) or "markers" change.
 * Captures run one after the other (fit to plot moves the map); stale results are dropped.
 * State is only set when a capture ends: "loading" is derived from the request (react-hooks set-state-in-effect).
 * @param {object} params - The parameters.
 * @param {L.Map|null} params.map - The map.
 * @param {boolean} params.includeData - Whether markers and measurements are captured.
 * @param {ScreenshotPlotCandidate|null} params.capturePlot - The plot to fit, or null for the current view.
 * @param {number} params.fitZoom - The fit-to-plot zoom.
 * @returns {CaptureState} The capture state.
 */
const useMapCapture = ({
  map,
  includeData,
  capturePlot,
  fitZoom,
}: {
  map: L.Map | null
  includeData: boolean
  capturePlot: ScreenshotPlotCandidate | null
  fitZoom: number
}): CaptureState => {
  const plotKey = capturePlot?.key ?? null
  // the dialog is modal: the base map and the layout cannot change while it is open
  const maplibre = useMemo(() => (map ? hasMaplibreLayer(map) : false), [map])
  const hidden = useMemo(() => (map ? isMapHidden(map) : false), [map])
  const request = useMemo<CaptureRequest | null>(
    () => (map && !maplibre && !hidden ? { map, includeData, plotKey, fitZoom } : null),
    [fitZoom, hidden, includeData, map, maplibre, plotKey]
  )
  const [finished, setFinished] = useState<FinishedCapture>({ request: null, result: null, errorDetails: null })
  const queueRef = useRef<Promise<unknown>>(Promise.resolve())
  const plotRef = useRef<ScreenshotPlotCandidate | null>(capturePlot)

  useEffect(() => {
    plotRef.current = capturePlot
  })

  useEffect(() => {
    if (!request) return undefined
    let current = true
    /**
     * Runs this request's capture, unless the request is stale.
     * @returns {Promise<MapCaptureResult|null>} The capture, or null when stale.
     */
    const run = (): Promise<MapCaptureResult | null> => {
      if (!current) return Promise.resolve(null)
      const plot = plotRef.current
      const { map: requestMap, includeData: requestIncludeData, fitZoom: zoom } = request
      return plot
        ? captureMapAtPlot({ map: requestMap, includeData: requestIncludeData, plot, zoom })
        : captureMapView({ map: requestMap, includeData: requestIncludeData })
    }
    const capture = queueRef.current.then(run, run)
    queueRef.current = capture.catch(() => null)
    capture.then(
      (result) => {
        if (result && current) setFinished({ request, result, errorDetails: null })
      },
      (error: unknown) => {
        if (current) setFinished({ request, result: null, errorDetails: errorToText(error) })
      }
    )
    return () => {
      current = false
    }
  }, [request])

  const settled = finished.request === request
  return {
    // the previous image stays in the preview while a new capture runs
    result: finished.result,
    loading: request !== null && !settled,
    errorDetails: settled ? finished.errorDetails : null,
    maplibre,
    hidden,
  }
}

/**
 * Draws the overlay on a capture and encodes the image.
 * @param {ComposeRequest} request - The capture, the format, what to include and the stamp values.
 * @returns {Promise<Blob>} The image.
 */
const composePreviewImage = ({
  capture,
  format,
  markCenter,
  includeScale,
  includeStamp,
  stamp,
}: ComposeRequest): Promise<Blob> => {
  const lines = buildStampLines({
    plotLabel: stamp.plotLabel,
    dateText: stamp.dateText,
    coordinatesText: formatStampCoordinates(stamp.plotPoint ?? capture.center),
    baseMapName: stamp.baseMapName,
    attributions: stamp.attributions,
  })
  const scaleBar = getScaleBar(metersPerPixel(capture.center.lat, capture.zoom), SCALE_BAR_MAX_WIDTH_PX)
  return canvasToBlob(
    composeScreenshot({
      source: capture.canvas,
      markCenter,
      includeScale,
      includeStamp,
      scaleBar,
      leftLines: lines.left,
      rightLines: lines.right,
    }),
    format
  )
}

/**
 * Stage 2: draws the overlay on the last capture and encodes the image; the object URL is revoked when replaced.
 * State is only set when the image is ready: "composing" is derived from the request.
 * @param {object} params - The parameters.
 * @param {MapCaptureResult|null} params.capture - The last capture.
 * @param {ScreenshotFormat} params.format - The image format.
 * @param {boolean} params.includeData - Whether markers are shown (then the plot of a fit-to-plot capture is ringed).
 * @param {boolean} params.includeScale - Whether to draw the scale bar and north arrow.
 * @param {boolean} params.includeStamp - Whether to draw the stamp.
 * @param {ScreenshotStamp} params.stamp - The stamp values.
 * @returns {ComposedImage} The image and its object URL.
 */
const useComposedImage = ({
  capture,
  format,
  includeData,
  includeScale,
  includeStamp,
  stamp,
}: {
  capture: MapCaptureResult | null
  format: ScreenshotFormat
  includeData: boolean
  includeScale: boolean
  includeStamp: boolean
  stamp: ScreenshotStamp
}): ComposedImage => {
  const request = useMemo<ComposeRequest | null>(
    () =>
      capture
        ? { capture, format, markCenter: capture.atPlot && includeData, includeScale, includeStamp, stamp }
        : null,
    [capture, format, includeData, includeScale, includeStamp, stamp]
  )
  const [finished, setFinished] = useState<FinishedImage>({ request: null, blob: null, url: null, errorDetails: null })
  const urlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    []
  )

  useEffect(() => {
    if (!request) return undefined
    let current = true
    Promise.resolve()
      .then(() => composePreviewImage(request))
      .then(
        (blob) => {
          if (!current) return
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          urlRef.current = URL.createObjectURL(blob)
          setFinished({ request, blob, url: urlRef.current, errorDetails: null })
        },
        (error: unknown) => {
          if (current) setFinished({ request, blob: null, url: null, errorDetails: errorToText(error) })
        }
      )
    return () => {
      current = false
    }
  }, [request])

  if (!request) return NO_IMAGE
  const settled = finished.request === request
  return {
    blob: finished.blob,
    url: finished.url,
    composing: !settled,
    errorDetails: settled ? finished.errorDetails : null,
  }
}

/**
 * Builds the screenshot preview: the image saved or downloaded is exactly the one shown.
 * @param {object} params - The parameters.
 * @param {L.Map|null} params.map - The map.
 * @param {ScreenshotOptions} params.options - Capture mode and what to include.
 * @param {ScreenshotFormat} params.format - The image format of the target.
 * @param {ScreenshotPlotCandidate|null} params.plot - The selected plot.
 * @param {number} params.fitZoom - The fit-to-plot zoom.
 * @param {ScreenshotStamp} params.stamp - The stamp values.
 * @returns {ScreenshotPreview} The preview.
 */
export const useScreenshotPreview = ({
  map,
  options,
  format,
  plot,
  fitZoom,
  stamp,
}: {
  map: L.Map | null
  options: ScreenshotOptions
  format: ScreenshotFormat
  plot: ScreenshotPlotCandidate | null
  fitZoom: number
  stamp: ScreenshotStamp
}): ScreenshotPreview => {
  const capturePlot = options.capture === 'plot' ? plot : null
  const capture = useMapCapture({ map, includeData: options.includeData, capturePlot, fitZoom })
  const image = useComposedImage({
    capture: capture.result,
    format,
    includeData: options.includeData,
    includeScale: options.includeScale,
    includeStamp: options.includeStamp,
    stamp,
  })
  const notice = useMemo(
    () =>
      getCaptureNotice({
        failedImages: capture.result?.failedImages ?? 0,
        maplibre: capture.maplibre,
        hidden: capture.hidden,
      }),
    [capture.hidden, capture.maplibre, capture.result]
  )
  return {
    blob: image.blob,
    url: image.url,
    loading: capture.loading || image.composing,
    notice,
    errorDetails: capture.errorDetails ?? image.errorDetails,
  }
}
