import { useOnCreate } from './useOnCreate'
import { useOnImport } from './useOnImport'
import { useOnUpdate } from './useOnUpdate'

export const useActions = ({ newSurvey, setNewSurvey }) => ({
  onUpdate: useOnUpdate({ newSurvey, setNewSurvey }),
  onCreate: useOnCreate({ newSurvey, setNewSurvey }),
  onImport: useOnImport({ newSurvey, setNewSurvey }),
})
