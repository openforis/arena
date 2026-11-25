import { useOnCreate } from './useOnCreate'
import { useOnImport } from './useOnImport'
import { useOnImportJobStart } from './useOnImportJobStart'
import { useOnImportUploadCancel } from './useOnImportUploadCancel'
import { useOnUpdate } from './useOnUpdate'

export const useActions = ({ newSurvey, setNewSurvey }) => ({
  onUpdate: useOnUpdate({ newSurvey, setNewSurvey }),
  onCreate: useOnCreate({ newSurvey, setNewSurvey }),
  onImport: useOnImport({ newSurvey, setNewSurvey }),
  onImportJobStart: useOnImportJobStart({ setNewSurvey }),
  onImportUploadCancel: useOnImportUploadCancel({ setNewSurvey }),
})
