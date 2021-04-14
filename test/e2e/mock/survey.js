export const survey = {
  name: 'survey',
  label: 'Survey',
  labels: {
    en: 'My Survey',
  },
  descriptions: {
    en: 'This is a survey description',
  },
  languages: ['en', 'fr'],
}

export const survey2 = {
  name: 'survey_2',
  label: 'Survey 2',
  labels: {
    en: 'Survey 2',
  },
}

export const surveyImport = {
  ...survey,
}

export const surveyClone = {
  cloneFrom: survey.name,
  name: 'survey_clone',
  label: 'My Survey cloned',
  labels: {
    en: 'My Survey cloned',
  },
  languages: ['en', 'fr'],
}

export const template = {
  name: 'survey_template',
  label: 'Survey Template',
  labels: {
    en: 'Survey Template',
  },
}

export const template2 = {
  name: 'survey_template_2',
  label: 'Survey Template 2',
  labels: {
    en: 'Survey Template 2',
  },
}
