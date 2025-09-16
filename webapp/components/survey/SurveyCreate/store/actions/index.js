import { useOnUpdate } from './useOnUpdate'
import { useOnCreate } from './useOnCreate'
import { useOnImport } from './useOnImport'
import { useOnImportJobStart } from './useOnImportJobStart'

export const useActions = ({ newSurvey, setNewSurvey }) => ({
  onUpdate: useOnUpdate({ newSurvey, setNewSurvey }),
  onCreate: useOnCreate({ newSurvey, setNewSurvey }),
  onImport: useOnImport({ newSurvey, setNewSurvey }),
  onImportJobStart: useOnImportJobStart({ newSurvey, setNewSurvey }),
})
