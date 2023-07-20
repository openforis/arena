export const useOnUpdate =
  ({ newSurvey, setNewSurvey }) =>
  (...nameValuePairs) => {
    const newSurveyNext = { ...newSurvey }
    nameValuePairs.forEach(({ name, value }) => {
      newSurveyNext[name] = value
    })
    setNewSurvey(newSurveyNext)
  }
