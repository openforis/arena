const R = require('ramda')

const NEW = 'new'
const DRAFT = 'draft'
const PUBLISHED = 'published'
const PUBLISHED_DRAFT = 'publishedDraft'

const surveyStatus = {
  // a new survey has been created
  // can add and delete nodes
  new: NEW,

  // an existing survey has been updated AND contains at least 1 entity defn
  // surveyDefn: can add and delete nodes
  // dataEntry: cannot add
  draft: DRAFT,

  // an existing survey does now allow further changes of properties of existing nodes
  // surveyDefn: cannot edit published nodes
  // surveyDefn: can add and delete new nodes
  // dataEntry: can add, edit, delete..
  published: PUBLISHED,

  // a publishedDraft survey diffs from the published version by the no of nodes
  // (at least 1 node was added or deleted)
  // surveyDefn: permissions same as published
  // dataEntry: can add, edit, delete..
  // BUT using survey definition of latest published version
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