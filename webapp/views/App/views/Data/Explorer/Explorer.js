import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { DataExplorerActions } from '@webapp/store/dataExplorer'

import DataQuery from '@webapp/components/DataQuery'
import { useLocationPathMatcher } from '@webapp/components/hooks/useIsInRoute'

const Explorer = () => {
  const dispatch = useDispatch()

  const pathMatcher = useLocationPathMatcher()

  const onUnmount = useCallback(() => {
    // if editing record (editMode is set) do not reset data explorer state
    if (!pathMatcher(appModuleUri(dataModules.explorer)) && !pathMatcher(`${appModuleUri(dataModules.record)}:uuid`)) {
      dispatch(DataExplorerActions.reset())
    }
  }, [dispatch, pathMatcher])

  useEffect(() => {
    return onUnmount
  }, [onUnmount])

  return <DataQuery />
}

export default Explorer
