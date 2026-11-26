import React from 'react'

import Dropdown from '@webapp/components/form/Dropdown'
import type {
  ScreenshotImageAttributeOption,
  ScreenshotPlotCandidate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

const PREFIX = 'mapWorkspace.screenshot'

type ScreenshotAttachFieldsProps = {
  candidates: ScreenshotPlotCandidate[]
  plot: ScreenshotPlotCandidate | null
  onPlotChange: (key: string) => void
  attributeOptions: ScreenshotImageAttributeOption[]
  attribute: ScreenshotImageAttributeOption | null
  onAttributeChange: (uuid: string) => void
  fileName: string
  onFileNameChange: (fileName: string) => void
}

/**
 * Renders the plot record, image attribute and file name fields, and the Arena Mobile note.
 * @param {object} props - The props.
 * @param {Array<ScreenshotPlotCandidate>} props.candidates - The plots.
 * @param {ScreenshotPlotCandidate|null} props.plot - The selected plot.
 * @param {Function} props.onPlotChange - Selects a plot by key.
 * @param {Array<ScreenshotImageAttributeOption>} props.attributeOptions - Image attributes of the plot.
 * @param {ScreenshotImageAttributeOption|null} props.attribute - The selected attribute.
 * @param {Function} props.onAttributeChange - Selects an attribute by uuid.
 * @param {Function} props.onFileNameChange - Changes the file name.
 */
export const ScreenshotAttachFields = ({
  candidates,
  plot,
  onPlotChange,
  attributeOptions,
  attribute,
  onAttributeChange,
  fileName,
  onFileNameChange,
}: ScreenshotAttachFieldsProps): React.ReactElement => {
  const i18n = useI18n()
  return (
    <>
      <div className="map-screenshot-dialog__attach">
        <div className="map-screenshot-dialog__field">
          <label htmlFor="map-screenshot-plot">{i18n.t(`${PREFIX}.plot`)}</label>
          <Dropdown
            idInput="map-screenshot-plot"
            clearable={false}
            itemLabel="label"
            itemValue="key"
            items={candidates}
            onChange={(candidate) => onPlotChange(candidate.key)}
            selection={plot}
            testId={TestId.mapWorkspace.screenshotPlot}
          />
        </div>
        <div className="map-screenshot-dialog__field">
          <label htmlFor="map-screenshot-attribute">{i18n.t(`${PREFIX}.attribute`)}</label>
          <Dropdown
            idInput="map-screenshot-attribute"
            clearable={false}
            disabled={attributeOptions.length === 0}
            itemLabel="label"
            itemValue="uuid"
            items={attributeOptions}
            onChange={(option) => onAttributeChange(option.uuid)}
            searchable={false}
            selection={attribute}
            testId={TestId.mapWorkspace.screenshotAttribute}
          />
        </div>
        <label className="map-screenshot-dialog__field map-screenshot-dialog__field--wide">
          {i18n.t(`${PREFIX}.fileName`)}
          <input
            type="text"
            value={fileName}
            data-testid={TestId.mapWorkspace.screenshotFileName}
            onChange={(event) => onFileNameChange(event.target.value)}
          />
        </label>
      </div>
      {plot && attributeOptions.length === 0 && (
        <p className="map-screenshot-dialog__hint">{i18n.t(`${PREFIX}.noImageAttributes`)}</p>
      )}
      <p className="map-screenshot-dialog__note">{i18n.t(`${PREFIX}.mobileNote`)}</p>
    </>
  )
}
