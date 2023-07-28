export const useOnUpdate =
  ({ newSurvey, setNewSurvey }) =>
  (...nameValuePairs) => {
    const newSurveyNext = {
      ...newSurvey,
      validation: null, // reset validation (validation performed server side)
    }
    nameValuePairs.forEach(({ name, value }) => {
      newSurveyNext[name] = value
    })
    setNewSurvey(newSurveyNext)
  }
