import React from 'react'
import { Checkbox, FormControlLabel, Radio, RadioGroup, Slider, TextField } from '@mui/material'

import {
  MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH,
  MAP_CUSTOM_LAYER_NAME_MAX_LENGTH,
  type MapCustomLayerRole,
  type MapCustomLayerScope,
  type MapImageFormat,
} from '@core/map/customLayers/mapCustomLayer'
import {
  getSummary,
  isLayerSelectable,
  isSingleLayer,
  WMS_MIN_OPACITY_PERCENT,
  type WmsDialogFormAction,
  type WmsDialogFormState,
} from '@webapp/components/MapContainer/workspace/customLayers/wms/wmsDialogForm'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

type SectionProps = { state: WmsDialogFormState; dispatch: (action: WmsDialogFormAction) => void }

const roles: MapCustomLayerRole[] = ['overlay', 'baseMap']
const formatLabelKeys: Record<MapImageFormat, string> = {
  'image/png': 'mapWorkspace.wms.formatPng',
  'image/jpeg': 'mapWorkspace.wms.formatJpeg',
}

/**
 * Shows what was loaded: "WMS 1.3.0 · 4 layers · Web Mercator supported".
 * @param {object} props - Props.
 * @param {WmsDialogFormState} props.state - The form state.
 * @returns {React.ReactElement|null} The summary, or null before loading.
 */
export const WmsSummary = ({ state }: { state: WmsDialogFormState }): React.ReactElement | null => {
  const t = useI18nT()
  const parts = getSummary(state)
  if (parts.length === 0) return null
  const text = parts.map((part) => part.text ?? t(part.key as string, part.params)).join(' · ')
  return (
    <output className="map-wms-dialog__summary" data-testid={TestId.mapWorkspace.wmsSummary}>
      {text}
    </output>
  )
}

/**
 * Lists the layers of the service; layers without Web Mercator tiles are shown but cannot be selected.
 * @param {object} props - Props.
 * @param {WmsDialogFormState} props.state - The form state.
 * @param {Function} props.dispatch - The form dispatch.
 * @returns {React.ReactElement|null} The checklist, or null when no service is loaded.
 */
export const WmsLayersChecklist = ({ state, dispatch }: SectionProps): React.ReactElement | null => {
  const t = useI18nT()
  const { capabilities } = state
  const layers = capabilities?.layers ?? []
  if (!capabilities || state.source !== 'capabilities' || layers.length === 0) return null
  return (
    <fieldset className="map-wms-dialog__section">
      <legend>{t('mapWorkspace.wms.layersToAdd')}</legend>
      <div className="map-wms-dialog__layers">
        {layers.map((layer) => (
          <FormControlLabel
            key={layer.name}
            data-testid={TestId.mapWorkspace.wmsLayerItem(layer.name)}
            disabled={!isLayerSelectable({ capabilities, layer })}
            control={
              <Checkbox
                size="small"
                checked={state.selectedLayerNames.includes(layer.name)}
                onChange={() => dispatch({ type: 'toggleLayer', name: layer.name })}
              />
            }
            label={
              <span className="map-wms-dialog__layer-label">
                <span>{layer.title}</span>
                <span className="map-wms-dialog__layer-name">
                  {layer.webMercator ? layer.name : t('mapWorkspace.wms.layerNotWebMercator')}
                </span>
              </span>
            }
          />
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Chooses how the layers are added: overlay (Layers tab) or base map (Base map menu).
 * @param {object} props - Props.
 * @param {WmsDialogFormState} props.state - The form state.
 * @param {Function} props.dispatch - The form dispatch.
 * @returns {React.ReactElement} The radio buttons, with the description of the chosen one.
 */
export const WmsAddAsField = ({ state, dispatch }: SectionProps): React.ReactElement => {
  const t = useI18nT()
  const labelKey = (role: MapCustomLayerRole) =>
    role === 'overlay' ? 'mapWorkspace.wms.addAsOverlay' : 'mapWorkspace.wms.addAsBaseMap'
  return (
    <fieldset className="map-wms-dialog__section">
      <legend>{t('mapWorkspace.wms.addAs')}</legend>
      <RadioGroup
        row
        value={state.role}
        onChange={(event) => dispatch({ type: 'setRole', role: event.target.value as MapCustomLayerRole })}
      >
        {roles.map((role) => {
          // a variable, not a literal: the input slot type has no data-* attributes
          const input = { 'data-testid': TestId.mapWorkspace.wmsAddAs(role) }
          return (
            <FormControlLabel
              key={role}
              value={role}
              control={<Radio size="small" slotProps={{ input }} />}
              label={t(labelKey(role))}
            />
          )
        })}
      </RadioGroup>
      <div className="map-wms-dialog__hint">{t(`${labelKey(state.role)}Description`)}</div>
    </fieldset>
  )
}

/**
 * Edits the display name, image format, opacity and attribution.
 * @param {object} props - Props.
 * @param {WmsDialogFormState} props.state - The form state.
 * @param {Function} props.dispatch - The form dispatch.
 * @param {MapImageFormat[]} props.formats - The formats the service offers (none for XYZ).
 * @returns {React.ReactElement} The fields.
 */
export const WmsDisplayFields = ({
  state,
  dispatch,
  formats,
}: SectionProps & { formats: MapImageFormat[] }): React.ReactElement => {
  const t = useI18nT()
  const single = isSingleLayer(state)
  return (
    <div className="map-wms-dialog__fields">
      <SimpleTextInput
        label="mapWorkspace.wms.displayName"
        placeholder={single ? undefined : 'mapWorkspace.wms.displayNameMultiple'}
        value={single ? state.name : ''}
        disabled={!single}
        maxLength={MAP_CUSTOM_LAYER_NAME_MAX_LENGTH}
        onChange={(name) => dispatch({ type: 'setName', name })}
        testId={TestId.mapWorkspace.wmsNameInput}
      />
      {formats.length > 0 && (
        <TextField
          select
          size="small"
          label={t('mapWorkspace.wms.imageFormat')}
          value={state.format}
          onChange={(event) => dispatch({ type: 'setFormat', format: event.target.value as MapImageFormat })}
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        >
          {formats.map((format) => (
            <option key={format} value={format}>
              {t(formatLabelKeys[format])}
            </option>
          ))}
        </TextField>
      )}
      <div className="map-wms-dialog__opacity">
        <span id="map-wms-opacity-label">{t('mapWorkspace.wms.opacity')}</span>
        <Slider
          size="small"
          aria-labelledby="map-wms-opacity-label"
          min={WMS_MIN_OPACITY_PERCENT}
          max={100}
          step={5}
          value={state.opacity}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}%`}
          onChange={(_event, value) => dispatch({ type: 'setOpacity', opacity: value as number })}
        />
      </div>
      <SimpleTextInput
        label="mapWorkspace.wms.attribution"
        value={state.attribution}
        maxLength={MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH}
        onChange={(attribution) => dispatch({ type: 'setAttribution', attribution })}
        testId={TestId.mapWorkspace.wmsAttributionInput}
      />
    </div>
  )
}

/**
 * Chooses who sees the layers: everyone in the survey (survey editors only) or only the current user.
 * @param {object} props - Props.
 * @param {WmsDialogFormState} props.state - The form state.
 * @param {Function} props.dispatch - The form dispatch.
 * @param {boolean} props.canEditSurvey - Whether the user can share layers with the survey.
 * @returns {React.ReactElement} The radio group.
 */
export const WmsScopeField = ({
  state,
  dispatch,
  canEditSurvey,
}: SectionProps & { canEditSurvey: boolean }): React.ReactElement => {
  const t = useI18nT()
  return (
    <fieldset className="map-wms-dialog__section">
      <legend>{t('mapWorkspace.wms.whoSeesIt')}</legend>
      <RadioGroup
        row
        value={state.scope}
        onChange={(event) => dispatch({ type: 'setScope', scope: event.target.value as MapCustomLayerScope })}
      >
        <FormControlLabel
          value="survey"
          disabled={!canEditSurvey}
          control={<Radio size="small" />}
          label={t('mapWorkspace.wms.scopeSurvey')}
        />
        <FormControlLabel value="user" control={<Radio size="small" />} label={t('mapWorkspace.wms.scopeUser')} />
      </RadioGroup>
    </fieldset>
  )
}
