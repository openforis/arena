const R = require('ramda')

const NEW = 'new'
const DRAFT = 'draft'
const PUBLISHED = 'published'
const PUBLISHED_DRAFT = 'publishedDraft'

const surveyStatus = {
  // a new survey has been created
  new: NEW,
  // an existing survey has been updated AND contains at least 1 entity
  draft: DRAFT,
  // an existing survey does now allow further changes of properties of existing nodes
  published: PUBLISHED,
  // a published survey diffs from the published version by the no of nodes
  // (at least 1 node was added or deleted)
  publishedDraft: PUBLISHED_DRAFT,

  isNew: R.equals(NEW),

  isPublished: R.equals(PUBLISHED),
}

const defaultSurvey = {
  id: -1,
  status: surveyStatus.new,
  // status: surveyStatus.draft,
}

module.exports = {
  defaultSurvey,
  surveyStatus,
}