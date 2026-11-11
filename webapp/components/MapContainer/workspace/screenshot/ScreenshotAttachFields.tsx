import React from 'react'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type {
  ScreenshotImageAttributeOption,
  ScreenshotPlotCandidate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

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
 * @param {string} props.fileName - The file name.
 * @param {Function} props.onFileNameChange - Changes the file name.
 * @returns {React.ReactElement} The fields.
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
        <label className="map-screenshot-dialog__field">
          {i18n.t(`${PREFIX}.plot`)}
          <select
            value={plot?.key ?? ''}
            data-testid={TestId.mapWorkspace.screenshotPlot}
            onChange={(event) => onPlotChange(event.target.value)}
          >
            {candidates.map((candidate) => (
              <option key={candidate.key} value={candidate.key}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <label className="map-screenshot-dialog__field">
          {i18n.t(`${PREFIX}.attribute`)}
          <select
            value={attribute?.uuid ?? ''}
            disabled={attributeOptions.length === 0}
            data-testid={TestId.mapWorkspace.screenshotAttribute}
            onChange={(event) => onAttributeChange(event.target.value)}
          >
            {attributeOptions.map((option) => (
              <option key={option.uuid} value={option.uuid}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
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
