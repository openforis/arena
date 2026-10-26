import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

import { getContextUser } from '../../integration/config/context'

const { integer, text } = NodeDef.nodeDefType

const futureDate = new Date(Date.now() + 60000).toISOString()

// "stamp" is read-only and re-evaluated (to 'computed') every time one of its inputs ("notes") is updated
const createSurvey = (user: any) =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', integer).key(),
      SB.attribute('notes', text),
      SB.attribute('stamp', text)
        .readOnly()
        .defaultValues(
          NodeDefExpression.createExpression({
            expression: "'computed'",
            applyIf: 'isEmpty(notes) || isNotEmpty(notes)',
          })
        )
    )
  ).build()

const createRecord = ({ user, survey, notes }: { user: any; survey: any; notes: string | null }) =>
  RB.record(
    user,
    survey,
    RB.entity('cluster', RB.attribute('cluster_id', 1), RB.attribute('notes', notes), RB.attribute('stamp', 'original'))
  ).build()

// simulates the record edited in Arena Mobile: copy of the target record with some attributes updated
const createSourceRecord = ({
  survey,
  record,
  updates,
}: {
  survey: any
  record: any
  updates: Record<string, { value?: any; dateModified?: string }>
}) => {
  const nodes = { ...record.nodes }
  for (const [path, { value, dateModified = futureDate }] of Object.entries(updates)) {
    const node = RecordUtils.findNodeByPath(path)(survey, record)
    let nodeUpdated = Node.assocDateModified(dateModified)(node)
    if (value !== undefined) {
      nodeUpdated = Node.assocValue(value)(nodeUpdated)
    }
    nodes[Node.getUuid(node)] = nodeUpdated
  }
  return { ...record, nodes }
}

const replaceUpdatedNodes = ({ survey, recordSource, recordTarget }: any) =>
  Record.replaceUpdatedNodes({
    user: getContextUser(),
    survey,
    recordSource,
    categoryItemProvider: null,
    taxonProvider: null,
    timezoneOffset: 0,
    sideEffect: false,
  })(recordTarget)

const getValue = ({ survey, record, path }: any) => RecordUtils.findNodeValueByPath(path)(survey, record)

describe('RecordNodesUpdater (replace nodes): unchanged and read-only attributes', () => {
  it('attributes empty in both records do not trigger the dependents update', async () => {
    const user = getContextUser()
    const survey = await createSurvey(user)
    const recordTarget = createRecord({ user, survey, notes: null })
    const recordSource = createSourceRecord({ survey, record: recordTarget, updates: { 'cluster/notes': {} } })

    const { record } = await replaceUpdatedNodes({ survey, recordSource, recordTarget })

    expect(getValue({ survey, record, path: 'cluster/stamp' })).toBe('original')
  })

  it('attributes with the same value only get the new date modified, without triggering the dependents update', async () => {
    const user = getContextUser()
    const survey = await createSurvey(user)
    const recordTarget = createRecord({ user, survey, notes: 'some notes' })
    const recordSource = createSourceRecord({ survey, record: recordTarget, updates: { 'cluster/notes': {} } })

    const { record, nodes } = await replaceUpdatedNodes({ survey, recordSource, recordTarget })

    expect(getValue({ survey, record, path: 'cluster/stamp' })).toBe('original')
    const notesNode = RecordUtils.findNodeByPath('cluster/notes')(survey, record)
    expect(new Date(Node.getDateModified(notesNode)).toISOString()).toBe(futureDate)
    // persisted as updated node
    expect(Node.isUpdated(nodes[Node.getUuid(notesNode)])).toBe(true)
  })

  it('read-only attributes keep the value calculated in the source record', async () => {
    const user = getContextUser()
    const survey = await createSurvey(user)
    const recordTarget = createRecord({ user, survey, notes: 'some notes' })
    const recordSource = createSourceRecord({
      survey,
      record: recordTarget,
      updates: { 'cluster/notes': { value: 'notes updated' }, 'cluster/stamp': { value: 'calculated in device' } },
    })

    const { record } = await replaceUpdatedNodes({ survey, recordSource, recordTarget })

    expect(getValue({ survey, record, path: 'cluster/notes' })).toBe('notes updated')
    expect(getValue({ survey, record, path: 'cluster/stamp' })).toBe('calculated in device')
  })

  it('updated attributes still trigger the dependents update', async () => {
    const user = getContextUser()
    const survey = await createSurvey(user)
    const recordTarget = createRecord({ user, survey, notes: 'some notes' })
    const recordSource = createSourceRecord({
      survey,
      record: recordTarget,
      updates: { 'cluster/notes': { value: 'notes updated' } },
    })

    const { record } = await replaceUpdatedNodes({ survey, recordSource, recordTarget })

    expect(getValue({ survey, record, path: 'cluster/notes' })).toBe('notes updated')
    expect(getValue({ survey, record, path: 'cluster/stamp' })).toBe('computed')
  })
})
