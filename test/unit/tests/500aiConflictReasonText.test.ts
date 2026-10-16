import { createI18nAsync, supportedLanguages } from '@core/i18n/i18nFactory'

import { isI18nKeyReason } from '@webapp/ai/changeSets/types'
import { getConflictReasonText, getResultTitle } from '@webapp/components/ai/Assistant/changeItemModel'
import { fakeT as t } from '../utils/fakeT'

const PLAIN_REASONS = [
  'nodeDefMissing',
  'valueChanged',
  'parentMissing',
  'nameTaken',
  'alreadyExists',
  'refMissing',
  'itemMissing',
  'surveyDirty',
  'surveyChanged',
  'dependencyNotApplied',
  'notSupported',
  'missingResult',
]

describe('conflict reason text (500)', () => {
  test('a plain reason has its own sentence key', () => {
    for (const reason of PLAIN_REASONS) {
      expect(getConflictReasonText(t, reason)).toBe(`aiAssistant.card.reason.${reason}`)
    }
  })

  test('an i18n key reason is translated with its params', () => {
    expect(getConflictReasonText(t, 'aiAssistant.issues.refEditDisabled', { name: 'region' })).toBe(
      'aiAssistant.issues.refEditDisabled{"name":"region"}'
    )
    expect(getConflictReasonText(t, 'validationErrors:nameInvalid')).toBe('validationErrors:nameInvalid')
  })

  test('any other text, such as a message of the server, is shown as it is', () => {
    expect(getConflictReasonText(t, 'boom')).toBe('boom')
    expect(getConflictReasonText(t, 'Request failed. Try: again')).toBe('Request failed. Try: again')
  })

  test('a node definition that would be invalid lists its issues, translated with their params', () => {
    const params = {
      name: 'plot',
      count: 2,
      issues: [
        { key: 'validationErrors:nameInvalid', params: {} },
        { key: 'aiAssistant.issues.expressionInvalid', params: { text: 'a +' } },
      ],
    }
    expect(getConflictReasonText(t, 'aiAssistant.issues.nodeDefInvalid', params)).toBe(
      `aiAssistant.issues.nodeDefInvalid${JSON.stringify(params)} validationErrors:nameInvalid{}; ` +
        'aiAssistant.issues.expressionInvalid{"text":"a +"}'
    )
    expect(
      getResultTitle({ id: 'a', status: 'conflict', message: 'aiAssistant.issues.nodeDefInvalid', params }, t)
    ).toContain('validationErrors:nameInvalid{}; ')
  })

  test('a conflict without issues has no trailing space', () => {
    expect(getConflictReasonText(t, 'aiAssistant.issues.nodeDefInvalid', { name: 'plot', issues: [] })).toBe(
      'aiAssistant.issues.nodeDefInvalid{"name":"plot","issues":[]}'
    )
  })

  test('a failed result with a server key is translated too', () => {
    expect(
      getResultTitle({ id: 'a', status: 'failed', message: 'appErrors:survey.fileNotFound', params: { a: 1 } }, t)
    ).toBe('appErrors:survey.fileNotFound{"a":1}')
  })

  test('isI18nKeyReason accepts the namespaces in use, not free text', () => {
    for (const key of [
      'aiAssistant.issues.refEditDisabled',
      'validationErrors:nodeDefEdit.nameInvalid',
      'appErrors:aiApplyTimeout',
    ]) {
      expect(isI18nKeyReason(key)).toBe(true)
    }
    for (const text of ['valueChanged', 'Request failed: status 400.', 'a.b', 'x:y', 'Invalid expression: a.b']) {
      expect(isI18nKeyReason(text)).toBe(false)
    }
  })

  test('every plain reason is a sentence in every language', async () => {
    for (const lang of supportedLanguages) {
      const i18n = await createI18nAsync(lang)
      for (const reason of PLAIN_REASONS) {
        const text = getConflictReasonText(i18n.t as any, reason)
        expect([lang, reason, text.startsWith('aiAssistant.')]).toEqual([lang, reason, false])
      }
      expect(i18n.exists('aiAssistant.card.discardFailed')).toBe(true)
    }
  })
})
