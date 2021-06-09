export const useOnUpdate =
  ({ newSurvey, setNewSurvey }) =>
  ({ name, value }) =>
    setNewSurvey({ ...newSurvey, [name]: value })
