import { useOnUpdate } from './useOnUpdate'
import { useOnCreate } from './useOnCreate'
import { useOnImport } from './useOnImport'

export const useActions = ({ newSurvey, setNewSurvey }) => ({
  onUpdate: useOnUpdate({ newSurvey, setNewSurvey }),
  onCreate: useOnCreate({ newSurvey, setNewSurvey }),
  onImport: useOnImport({ newSurvey, setNewSurvey }),
})
