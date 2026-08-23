import test from 'node:test'
import assert from 'node:assert/strict'
import AdmZip from 'adm-zip'

import { buildSampleSurveyZipBuffer, generateSampleSurveyUuids, type SampleSurveyUuids } from './sampleSurveyZip.ts'

const fixedUuids: SampleSurveyUuids = {
  surveyUuid: '11111111-1111-1111-1111-111111111111',
  ownerUuid: '22222222-2222-2222-2222-222222222222',
  rootEntityUuid: '33333333-3333-3333-3333-333333333333',
  idAttributeUuid: '44444444-4444-4444-4444-444444444444',
  notesAttributeUuid: '55555555-5555-5555-5555-555555555555',
}

const readEntries = (buffer: Buffer): AdmZip => new AdmZip(buffer)

test('buildSampleSurveyZipBuffer produces a valid zip with the expected entries', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const zip = readEntries(buffer)
  const entryNames = zip.getEntries().map((entry) => entry.entryName)

  assert.deepEqual([...entryNames].sort(), ['categories/categories.json', 'survey.json', 'taxonomies/taxonomies.json'])
})

test('survey.json has a non-empty authGroups with a surveyAdmin group', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))

  assert.ok(Array.isArray(survey.authGroups))
  assert.ok(survey.authGroups.length > 0)
  assert.ok(survey.authGroups.some((group: { name: string }) => group.name === 'surveyAdmin'))
})

test('survey.json has one non-empty language and no srs/cycles overrides', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))

  assert.deepEqual(survey.props.languages, ['en'])
  assert.equal(survey.props.srs, undefined)
  assert.equal(survey.props.cycles, undefined)
})

test('survey.json nodeDefs describe one root entity with two child attributes, one of them a key', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))
  const nodeDefs = Object.values(survey.nodeDefs) as Array<{
    uuid: string
    type: string
    parentUuid: string | null
    props: { name: string; key?: boolean }
  }>

  assert.equal(nodeDefs.length, 3)

  const root = nodeDefs.find((nodeDef) => nodeDef.uuid === fixedUuids.rootEntityUuid)
  assert.equal(root?.type, 'entity')
  assert.equal(root?.parentUuid, null)

  const idAttribute = nodeDefs.find((nodeDef) => nodeDef.uuid === fixedUuids.idAttributeUuid)
  assert.equal(idAttribute?.type, 'integer')
  assert.equal(idAttribute?.parentUuid, fixedUuids.rootEntityUuid)
  assert.equal(idAttribute?.props.key, true)

  const notesAttribute = nodeDefs.find((nodeDef) => nodeDef.uuid === fixedUuids.notesAttributeUuid)
  assert.equal(notesAttribute?.type, 'text')
  assert.equal(notesAttribute?.parentUuid, fixedUuids.rootEntityUuid)
})

test('categories.json and taxonomies.json are empty but present', () => {
  const buffer = buildSampleSurveyZipBuffer(fixedUuids)
  const zip = readEntries(buffer)

  assert.equal(zip.readAsText('categories/categories.json'), '{}')
  assert.equal(zip.readAsText('taxonomies/taxonomies.json'), '[]')
})

test('generateSampleSurveyUuids returns a fresh, distinct set on every call', () => {
  const first = generateSampleSurveyUuids()
  const second = generateSampleSurveyUuids()

  assert.notEqual(first.surveyUuid, second.surveyUuid)
  assert.notEqual(first.rootEntityUuid, second.rootEntityUuid)
})

test('buildSampleSurveyZipBuffer called with no arguments still produces a valid, parseable zip', () => {
  const buffer = buildSampleSurveyZipBuffer()
  const survey = JSON.parse(readEntries(buffer).readAsText('survey.json'))

  assert.ok(survey.uuid)
  assert.equal(Object.keys(survey.nodeDefs).length, 3)
})
