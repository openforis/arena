export const Selectors = {
  header: {
    createSurvey: 'text="Create Survey"',
    mySurveys: 'text="My Surveys"',
    userBtn: '#user-btn',
  },
  dashboard: {
    editInfo: 'text="Edit info"',
  },
  navigation: {
    home: 'a[id="sidebar_btn_home"]',
  },
  surveyList: {
    surveyRow: (rowIdx) => `#surveys_${rowIdx}`,
  },
}
