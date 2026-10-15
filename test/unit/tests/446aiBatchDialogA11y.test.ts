import fs from 'fs'
import path from 'path'

import { getDismissAction } from '@webapp/components/ai/AiBatchProgressDialog/batchDismiss'

const dialogSource = fs.readFileSync(
  path.join(__dirname, '../../../webapp/components/ai/AiBatchProgressDialog/AiBatchProgressDialog.tsx'),
  'utf8'
)

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

  describe('the stop question', () => {
    test('is labelled by its own text, not by a copy of it', () => {
      expect(dialogSource).toMatch(/role="alertdialog"\s+aria-labelledby=\{CONFIRM_TEXT_ID\}/)
      expect(dialogSource).toMatch(/<span id=\{CONFIRM_TEXT_ID\}>/)
      expect(dialogSource).not.toMatch(/role="alertdialog"[^>]*aria-label=/)
    })

    test('gives the focus to Keep running', () => {
      expect(dialogSource).toMatch(/autoFocus\s+label="aiBatch\.keepRunning"/)
    })
  })
})
