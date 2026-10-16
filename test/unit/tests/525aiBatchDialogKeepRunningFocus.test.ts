import fs from 'fs'
import path from 'path'

import { createConfirmationFocus } from '@webapp/components/ai/Assistant/confirmationFocus'

const dialogSource = fs.readFileSync(
  path.join(__dirname, '../../../webapp/components/ai/AiBatchProgressDialog/AiBatchProgressDialog.tsx'),
  'utf8'
)

describe('AI batch progress dialog: focus after Keep running (525)', () => {
  test('Keep running gives the focus back to the Stop button the question was asked from', () => {
    const stop = { focus: jest.fn() }
    const focus = createConfirmationFocus()
    focus.remember(stop)
    focus.cancel()
    expect(stop.focus).toHaveBeenCalledTimes(1)
  })

  test('the dialog remembers its Stop button when the question opens and returns to it on Keep running', () => {
    expect(dialogSource).toMatch(/ref=\{setStopButton\}/)
    expect(dialogSource).toMatch(/focus\.remember\(stopButton\)/)
    expect(dialogSource).toMatch(/const onKeepRunning = useCallback\(\(\) => \{\s+focus\.cancel\(\)/)
  })
})
