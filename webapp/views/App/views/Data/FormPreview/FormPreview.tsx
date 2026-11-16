import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import Record from '@webapp/components/survey/Record'
import { RecordActions, RecordState } from '@webapp/store/ui/record'

/**
 * Preview of the draft form (in a temporary preview record) for data entry users: it goes back to the records list when closed.
 * @returns {React.ReactElement|null} - The preview record form.
 */
export const FormPreview = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const navigate = useNavigate()
  const recordUuidPreview = useSelector(RecordState.getRecordUuidPreview)
  const previewStartedRef = useRef(false)

  useEffect(() => {
    dispatch(RecordActions.createRecord({ preview: true }))
    // the preview record uuid must not be kept when leaving the preview, otherwise it would be opened instead of other records
    return () => {
      dispatch(RecordActions.deleteRecordUuidPreview())
    }
  }, [dispatch])

  useEffect(() => {
    if (recordUuidPreview) {
      previewStartedRef.current = true
    } else if (previewStartedRef.current) {
      // preview closed
      navigate(appModuleUri(dataModules.records))
    }
  }, [navigate, recordUuidPreview])

  return recordUuidPreview ? <Record /> : null
}
