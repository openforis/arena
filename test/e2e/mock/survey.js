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
  isImport: true,
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

export const templateFromSurvey = {
  cloneFrom: survey.name,
  name: 'template_from_survey',
  label: survey.label,
  labels: survey.labels,
  languages: survey.languages,
}

export const surveyFromTemplate = {
  cloneFrom: templateFromSurvey.name,
  name: 'survey_from_template',
  label: templateFromSurvey.label,
  labels: templateFromSurvey.labels,
  languages: templateFromSurvey.languages,
}

export const templates = [template, template2, templateFromSurvey]
