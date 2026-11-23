import { useCallback } from 'react'

export const useOnImportUploadCancel = ({ setNewSurvey }) =>
  useCallback(() => {
    setNewSurvey((oldNewSurvey) => ({ ...oldNewSurvey, uploading: false }))
  }, [setNewSurvey])
