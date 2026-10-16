import { runWithFailureNotice } from '@webapp/components/ai/Assistant/runWithFailureNotice'

describe('card action failure notice (503)', () => {
  test('a successful action notifies nothing', async () => {
    const notifyError = jest.fn()
    const action = jest.fn(async () => undefined)
    await expect(runWithFailureNotice({ action, notifyError, key: 'aiAssistant.card.discardFailed' })).resolves.toBe(
      true
    )
    expect(action).toHaveBeenCalledTimes(1)
    expect(notifyError).not.toHaveBeenCalled()
  })

  test('a failed discard is notified with its key and the error message, and does not reject', async () => {
    const notifyError = jest.fn()
    const action = async () => {
      throw new Error('idb closed')
    }
    await expect(runWithFailureNotice({ action, notifyError, key: 'aiAssistant.card.discardFailed' })).resolves.toBe(
      false
    )
    expect(notifyError).toHaveBeenCalledWith({
      key: 'aiAssistant.card.discardFailed',
      params: { message: 'idb closed' },
    })
  })

  test('a synchronous throw and a rejection without a message are handled too', async () => {
    const notifyError = jest.fn()
    await runWithFailureNotice({
      action: () => {
        throw new Error('sync')
      },
      notifyError,
      key: 'k',
    })
    await runWithFailureNotice({ action: () => Promise.reject(undefined), notifyError, key: 'k' })
    expect(notifyError.mock.calls).toEqual([
      [{ key: 'k', params: { message: 'sync' } }],
      [{ key: 'k', params: { message: '' } }],
    ])
  })
})
