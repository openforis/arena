import React, { useCallback, useMemo, useState } from 'react'
import axios from 'axios'
import PropTypes from 'prop-types'

import { Button, ButtonMenu } from '@webapp/components'
import { useSurveyId } from '@webapp/store/survey'

const getWhispEarthMapUrl = (geojson) => `https://whisp.earthmap.org/?aoi=global&polygon=${JSON.stringify(geojson)}`

const getWhispDataDownloadUrl = (token) => `https://whisp.openforis.org/api/download-csv/${token}`

export const WhispMenuButton = (props) => {
  const { geoJsonGenerator } = props

  const surveyId = useSurveyId()
  const [whispDataLoading, setWhispDataLoading] = useState(false)

  const onWhispCsvButtonClick = useCallback(async () => {
    setWhispDataLoading(true)
    const geojson = geoJsonGenerator()
    const url = `/api/survey/${surveyId}/geo/whisp/geojson/csv`
    try {
      const { data: token } = await axios.post(url, geojson)
      const csvDownloadUrl = getWhispDataDownloadUrl(token)
      setWhispDataLoading(false)
      window.open(csvDownloadUrl, 'Whisp')
    } catch (_error) {
      setWhispDataLoading(false)
    }
  }, [geoJsonGenerator, surveyId])

  const onWhispEarthMapButtonClick = useCallback(() => {
    const geojson = geoJsonGenerator()
    const url = getWhispEarthMapUrl(geojson)
    window.open(url, 'WhispEarthMap')
  }, [geoJsonGenerator])

  const whispButtonDefinitions = useMemo(
    () => ({
      earthMap: {
        label: 'mapView.whispEarthMap',
        onClick: onWhispEarthMapButtonClick,
      },
      csv: {
        label: 'mapView.whispCsv',
        onClick: onWhispCsvButtonClick,
      },
    }),
    [onWhispCsvButtonClick, onWhispEarthMapButtonClick]
  )

  const buttons = useMemo(
    () =>
      Object.entries(whispButtonDefinitions).map(([key, { label, onClick }]) => ({
        key,
        content: (
          <Button
            disabled={whispDataLoading}
            label={label}
            iconHeight={25}
            iconSrc="/img/of_whisp_icon.svg"
            iconWidth={25}
            onClick={onClick}
            size="small"
            variant="text"
          />
        ),
      })),
    [whispButtonDefinitions, whispDataLoading]
  )

  return (
    <ButtonMenu
      className="whisp-menu-btn"
      disabled={whispDataLoading}
      label={whispDataLoading ? 'common.loading' : 'mapView.whisp'}
      iconAlt="Whisp"
      iconHeight={25}
      iconSrc="/img/of_whisp_icon.svg"
      items={buttons}
      variant="outlined"
    />
  )
}

WhispMenuButton.propTypes = {
  geoJsonGenerator: PropTypes.func.isRequired,
}
