import { getDismissAction } from '@webapp/components/ai/AiBatchProgressDialog/batchDismiss'

describe('AI batch progress dialog accessibility (446)', () => {
  describe('backdrop click and Escape', () => {
    test('while running they ask before stopping', () => {
      expect(getDismissAction({ error: false, asking: false, stopping: false })).toBe('ask')
    })

    test('while the question is shown they answer it: keep running', () => {
      expect(getDismissAction({ error: false, asking: true, stopping: false })).toBe('keepRunning')
    })

    test('after an error they close; while stopping they do nothing', () => {
      expect(getDismissAction({ error: true, asking: false, stopping: false })).toBe('close')
      expect(getDismissAction({ error: false, asking: false, stopping: true })).toBe('none')
    })
  })
})
