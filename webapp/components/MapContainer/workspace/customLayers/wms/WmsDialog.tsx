import './WmsDialog.scss'

import React, { useCallback, useEffect, useReducer, useRef } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

import { MAP_CUSTOM_LAYER_URL_MAX_LENGTH } from '@core/map/customLayers/mapCustomLayer'
import { uuidv4 } from '@core/uuid'
import { Button, ButtonCancel } from '@webapp/components/buttons'
import { SimpleTextInput } from '@webapp/components/form/SimpleTextInput'
import { toCustomBaseLayerDef } from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'
import { useMapCustomLayers } from '@webapp/components/MapContainer/workspace/customLayers/MapCustomLayersContext'
import { useMapBaseLayerApi } from '@webapp/components/MapContainer/workspace/customLayers/useMapBaseLayerApi'
import {
  buildMapCustomLayers,
  canSubmit,
  createWmsDialogFormState,
  getAvailableFormats,
  getSubmitLabel,
  getUrlLoadMode,
  stopsMapShortcut,
  toErrorMessage,
  wmsDialogFormReducer,
} from '@webapp/components/MapContainer/workspace/customLayers/wms/wmsDialogForm'
import {
  WmsAddAsCards,
  WmsDisplayFields,
  WmsLayersChecklist,
  WmsScopeField,
  WmsSummary,
} from '@webapp/components/MapContainer/workspace/customLayers/wms/WmsDialogSections'
import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useI18nT } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

/**
 * Keeps keys typed or pressed in the dialog from the map shortcuts (Escape still closes the dialog).
 * @param {React.KeyboardEvent} event - The key event.
 * @returns {void}
 */
const onDialogKeyDown = (event: React.KeyboardEvent): void => {
  if (stopsMapShortcut(event.key)) event.stopPropagation()
}

/**
 * Loads the layers of a service URL; a {z}/{x}/{y} template needs no request.
 * @returns {object} The form state, its dispatch, and the URL change and load handlers.
 */
const useWmsDialogForm = () => {
  const surveyId = useSurveyId()
  const canEditSurvey = Boolean(useAuthCanEditSurvey())
  const [state, dispatch] = useReducer(wmsDialogFormReducer, { canEditSurvey }, createWmsDialogFormState)
  // answers to an older URL (or arriving after the dialog closed) are ignored
  const requestIdRef = useRef(0)

  useEffect(
    () => () => {
      requestIdRef.current += 1
    },
    []
  )

  const onUrlChange = useCallback((url: string) => {
    requestIdRef.current += 1
    dispatch({ type: 'setUrl', url })
  }, [])

  const onLoad = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      const mode = getUrlLoadMode(state.url)
      if (mode === 'xyz') {
        dispatch({ type: 'xyzLoaded' })
        return
      }
      if (mode !== 'capabilities') {
        dispatch({ type: 'loadFailed', error: { key: 'appErrors:mapCustomLayers.urlInvalid' } })
        return
      }
      requestIdRef.current += 1
      const requestId = requestIdRef.current
      dispatch({ type: 'loadStarted' })
      try {
        const capabilities = await API.fetchMapServiceCapabilities({ surveyId, url: state.url.trim() })
        if (requestId === requestIdRef.current) dispatch({ type: 'capabilitiesLoaded', capabilities })
      } catch (error) {
        if (requestId !== requestIdRef.current) return
        dispatch({ type: 'loadFailed', error: toErrorMessage(error, 'mapWorkspace.wms.errors.loadFailed') })
      }
    },
    [state.url, surveyId]
  )

  return { state, dispatch, canEditSurvey, onUrlChange, onLoad }
}

/**
 * "Add a WMS / WMTS service" dialog: loads the layers of a service (or takes an XYZ template), and stores the chosen
 * layers as overlays or base maps, for everyone in the survey or only for the current user.
 * Registered as the `wms` dialog of the workspace: it takes no props and closes itself.
 * @returns {React.ReactElement} The dialog.
 */
export const WmsDialog = (): React.ReactElement => {
  const t = useI18nT()
  const { portalContainer, dispatch: workspaceDispatch } = useMapWorkspace()
  const onClose = useCallback(() => workspaceDispatch({ type: 'closeDialog' }), [workspaceDispatch])
  const { addLayers, fetchFailed } = useMapCustomLayers()
  const { selectBaseLayer } = useMapBaseLayerApi()
  const { state, dispatch, canEditSurvey, onUrlChange, onLoad } = useWmsDialogForm()
  const loadMode = getUrlLoadMode(state.url)
  const submitLabel = getSubmitLabel(state)

  const onSubmit = useCallback(async () => {
    const layers = buildMapCustomLayers({ state, newId: uuidv4 })
    dispatch({ type: 'savingChanged', saving: true })
    try {
      await addLayers({ scope: state.scope, layers })
    } catch (error) {
      dispatch({
        type: 'savingChanged',
        saving: false,
        error: toErrorMessage(error, 'mapWorkspace.wms.errors.saveFailed'),
      })
      return
    }
    if (state.role === 'baseMap') selectBaseLayer(toCustomBaseLayerDef({ ...layers[0], scope: state.scope }))
    else workspaceDispatch({ type: 'openRailTab', tab: 'layers' })
    onClose()
  }, [addLayers, dispatch, onClose, selectBaseLayer, state, workspaceDispatch])

  return (
    <Dialog
      open
      container={portalContainer}
      fullWidth
      maxWidth="sm"
      className="map-wms-dialog"
      data-testid={TestId.mapWorkspace.wmsDialog}
      onClose={onClose}
      onKeyDown={onDialogKeyDown}
    >
      <DialogTitle>{t('mapWorkspace.wms.title')}</DialogTitle>
      <DialogContent>
        {fetchFailed && (
          <p className="map-wms-dialog__error" role="alert">
            {t('mapWorkspace.wms.errors.fetchLayersFailed')}
          </p>
        )}
        <form className="map-wms-dialog__url" onSubmit={onLoad}>
          <SimpleTextInput
            autoFocus
            label="mapWorkspace.wms.serviceUrl"
            placeholder="mapWorkspace.wms.serviceUrlPlaceholder"
            value={state.url}
            maxLength={MAP_CUSTOM_LAYER_URL_MAX_LENGTH}
            onChange={onUrlChange}
            testId={TestId.mapWorkspace.wmsUrlInput}
          />
          <Button
            type="submit"
            label={state.loadStatus === 'loading' ? 'mapWorkspace.wms.loading' : 'mapWorkspace.wms.loadLayers'}
            disabled={loadMode === 'empty' || state.loadStatus === 'loading'}
            testId={TestId.mapWorkspace.wmsLoadButton}
          />
        </form>
        <p className="map-wms-dialog__hint">{t('mapWorkspace.wms.urlHint')}</p>
        {state.error && (
          <p className="map-wms-dialog__error" role="alert" data-testid={TestId.mapWorkspace.wmsError}>
            {t(state.error.key, state.error.params)}
          </p>
        )}
        <WmsSummary state={state} />
        {state.loadStatus === 'loaded' && (
          <>
            <WmsLayersChecklist state={state} dispatch={dispatch} />
            <WmsAddAsCards state={state} dispatch={dispatch} />
            <WmsDisplayFields state={state} dispatch={dispatch} formats={getAvailableFormats(state)} />
            <WmsScopeField state={state} dispatch={dispatch} canEditSurvey={canEditSurvey} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <ButtonCancel onClick={onClose} />
        <Button
          primary
          label={submitLabel.key}
          labelParams={submitLabel.params}
          disabled={!canSubmit(state) || fetchFailed}
          onClick={onSubmit}
          testId={TestId.mapWorkspace.wmsSubmit}
        />
      </DialogActions>
    </Dialog>
  )
}
