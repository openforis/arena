import { createConfirmationFocus } from '@webapp/components/ai/Assistant/confirmationFocus'

describe('AI batch progress dialog: focus after Keep running (525)', () => {
  test('Keep running gives the focus back to the Stop button the question was asked from', () => {
    const stop = { focus: jest.fn() }
    const focus = createConfirmationFocus()
    focus.remember(stop)
    focus.cancel()
    expect(stop.focus).toHaveBeenCalledTimes(1)
  })
})
