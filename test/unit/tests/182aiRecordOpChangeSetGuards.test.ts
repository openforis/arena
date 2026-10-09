import { applyChangeSet, type ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import { findConflicts } from '@webapp/ai/changeSets/findConflicts'
import { previewChangeSet } from '@webapp/ai/changeSets/previewChangeSet'
import { describeOperation } from '@webapp/ai/changeSets/describeOperation'
import { RECORD_ATTRIBUTE_UPDATE } from '@webapp/ai/changeSets/recordEdits/types'
import type { ChangeSet } from '@webapp/ai/changeSets/types'

import { cleaningTestSurvey } from '@test/unit/utils/aiCleaningTestUtils'

const changeSet: ChangeSet = {
  id: 'cs',
  surveyId: 1,
  summary: 's',
  createdAt: '2026-10-06T10:00:00.000Z',
  operations: [
    {
      id: 'op1',
      type: RECORD_ATTRIBUTE_UPDATE,
      recordUuid: 'r',
      nodeUuid: 'n',
      nodeDefUuid: 'not-a-nodedef-of-the-survey',
      recordKeys: '12',
      path: 'cluster[12] / remarks',
      from: '',
      to: 'x',
      preview: { badge: 'noErrors', messages: [], recordNewErrors: 0 },
      page: { nodeUuid: 'p', nodeDefUuid: 'pd' },
      display: { from: '', to: 'x' },
    },
  ],
}

test('a record operation never reaches the survey paths', async () => {
  const survey = await cleaningTestSurvey()
  expect(findConflicts(changeSet, survey)).toEqual([])
  const preview = await previewChangeSet(changeSet, survey, { t: (key: string) => key })
  expect(preview.validation).toEqual({ valid: true, issues: [] })
  expect(preview.survey).toBe(survey)
  expect(describeOperation(changeSet.operations[0], { changeSet, survey })).toBe('12: cluster[12] / remarks')

  const fail = async () => {
    throw new Error('must not be called')
  }
  const deps: ApplierDeps = {
    getSurvey: () => survey,
    getCycle: () => '0',
    isSurveyDirty: () => false,
    postNodeDef: fail,
    putNodeDefProps: fail,
    onNodeDefCreated: fail,
    onNodeDefUpdated: fail,
    onNodeDefSaved: fail,
  }
  expect(await applyChangeSet({ changeSet, operationIds: ['op1'], deps })).toEqual([])
})
