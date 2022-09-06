import { useOnUpdate } from './useOnUpdate'
import { useOnCreate } from './useOnCreate'
import { useOnImport, importSources } from './useOnImport'

export const useActions = ({ newSurvey, setNewSurvey }) => ({
  onUpdate: useOnUpdate({ newSurvey, setNewSurvey }),
  onCreate: useOnCreate({ newSurvey, setNewSurvey }),
  onImport: {
    Collect: useOnImport({ newSurvey, setNewSurvey, source: importSources.collect }),
    Arena: useOnImport({ newSurvey, setNewSurvey, source: importSources.arena }),
  },
})
