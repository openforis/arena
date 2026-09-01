import crypto from 'node:crypto'

import AdmZip from 'adm-zip'

export interface SampleSurveyUuids {
  surveyUuid: string
  ownerUuid: string
  rootEntityUuid: string
  idAttributeUuid: string
  notesAttributeUuid: string
}

// Minimal set of permissions/steps for a single surveyAdmin auth group, copied from
// core/auth/authGroup.ts (permissionsByGroupName.surveyAdmin) rather than imported: files in
// test/load run standalone via `node --experimental-strip-types` with no path-alias resolution
// for @core/*, matching every other file in this directory (see test/load/lib/config.ts etc.).
// A survey.json with zero authGroups fails import: SurveyCreatorJob passes
// Survey.getAuthGroups(...) (an explicit R.propOr([], 'authGroups') default) straight into
// SurveyManager.importSurvey, which only falls back to its own default authGroups when the
// argument is literally undefined -- an explicit [] suppresses that fallback, leaving no
// surveyAdmin group for _addUserToSurveyAdmins to add the importing user to.
const SAMPLE_SURVEY_AUTH_GROUPS = [
  {
    name: 'surveyAdmin',
    permissions: [
      'permissionsEdit',
      'surveyEdit',
      'recordView',
      'recordCreate',
      'recordEdit',
      'recordCleanse',
      'recordAnalyse',
      'userEdit',
      'userInvite',
    ],
    recordSteps: { '1': 'all', '2': 'all', '3': 'all' },
  },
]

/**
 * Builds the survey.json content for a minimal, valid Arena survey export: one root entity with
 * an integer key attribute and a text attribute, one language, and one authGroups entry. `srs`
 * and `cycles` are deliberately omitted from `props` so the server fills in its own defaults
 * (core/survey/survey.js `newSurvey`) instead of this fixture having to replicate them exactly.
 * @param uuids - UUIDs to embed for the survey and its node defs.
 * @returns The survey.json object, ready to JSON.stringify.
 */
const buildSurveyJson = (uuids: SampleSurveyUuids): Record<string, unknown> => {
  const { surveyUuid, ownerUuid, rootEntityUuid, idAttributeUuid, notesAttributeUuid } = uuids
  return {
    uuid: surveyUuid,
    ownerUuid,
    draft: true,
    published: false,
    template: false,
    authGroups: SAMPLE_SURVEY_AUTH_GROUPS,
    props: {
      name: 'stress_test_template',
      languages: ['en'],
      labels: { en: 'Stress Test Survey' },
    },
    propsDraft: {},
    nodeDefs: {
      [rootEntityUuid]: {
        uuid: rootEntityUuid,
        type: 'entity',
        parentUuid: null,
        props: { name: 'root_entity', labels: { en: 'Root entity' }, cycles: ['0'] },
        meta: { h: [] },
      },
      [idAttributeUuid]: {
        uuid: idAttributeUuid,
        type: 'integer',
        parentUuid: rootEntityUuid,
        props: { name: 'id', labels: { en: 'Id' }, key: true, cycles: ['0'] },
        meta: { h: [rootEntityUuid] },
      },
      [notesAttributeUuid]: {
        uuid: notesAttributeUuid,
        type: 'text',
        parentUuid: rootEntityUuid,
        props: { name: 'notes', labels: { en: 'Notes' }, cycles: ['0'] },
        meta: { h: [rootEntityUuid] },
      },
    },
    categories: {},
    taxonomies: {},
  }
}

/**
 * Generates a fresh set of UUIDs for one sample survey zip build.
 * @returns A new, distinct UUID for the survey and each of its node defs.
 */
export const generateSampleSurveyUuids = (): SampleSurveyUuids => ({
  surveyUuid: crypto.randomUUID(),
  ownerUuid: crypto.randomUUID(),
  rootEntityUuid: crypto.randomUUID(),
  idAttributeUuid: crypto.randomUUID(),
  notesAttributeUuid: crypto.randomUUID(),
})

/**
 * Builds a minimal, valid Arena survey export/backup zip in memory: one root entity with an
 * integer key attribute and a text attribute. The same returned buffer can be reused for many
 * concurrent POST /api/survey/arena-import requests -- node defs live in a per-survey Postgres
 * schema (survey_<id>), so identical UUIDs across concurrent imports of one buffer never collide.
 * @param [uuids] - UUIDs to embed in the zip (defaults to a freshly generated set).
 * @returns The zip file content, ready to write to disk or upload directly.
 */
export const buildSampleSurveyZipBuffer = (uuids: SampleSurveyUuids = generateSampleSurveyUuids()): Buffer => {
  const zip = new AdmZip()
  zip.addFile('survey.json', Buffer.from(JSON.stringify(buildSurveyJson(uuids)), 'utf-8'))
  zip.addFile('categories/categories.json', Buffer.from('{}', 'utf-8'))
  zip.addFile('taxonomies/taxonomies.json', Buffer.from('[]', 'utf-8'))
  return zip.toBuffer()
}
