import { createPurgeSurveyAiData } from '@webapp/ai/conversations/purgeSurveyAiData'

describe('purge of a deleted survey waits for the running assistant (523)', () => {
  test('the answers are stopped and their saves ended before anything is deleted', async () => {
    const calls: string[] = []
    let releaseSaves: () => void = () => undefined
    const purge = createPurgeSurveyAiData({
      stopTurns: async () => {
        calls.push('stop')
        await new Promise<void>((resolve) => {
          releaseSaves = resolve
        })
        calls.push('saved')
      },
      getConversationStore: async () => ({
        removeSurvey: async () => {
          calls.push('conversations')
        },
      }),
      openConversations: { clearSurvey: () => calls.push('open') as unknown as void },
      suggestions: { removeSurvey: () => calls.push('suggestions') as unknown as void },
      log: jest.fn(),
    })
    const done = purge(7)
    await Promise.resolve()
    expect(calls).toEqual(['stop'])
    releaseSaves()
    await done
    expect(calls).toEqual(['stop', 'saved', 'open', 'suggestions', 'conversations'])
  })

  test('a failing stop is logged and the purge goes on', async () => {
    const log = jest.fn()
    const removeSurvey = jest.fn(async () => undefined)
    const purge = createPurgeSurveyAiData({
      stopTurns: async () => {
        throw new Error('boom')
      },
      getConversationStore: async () => ({ removeSurvey }),
      openConversations: { clearSurvey: jest.fn() },
      suggestions: { removeSurvey: jest.fn() },
      log,
    })
    await expect(purge(7)).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledTimes(1)
    expect(removeSurvey).toHaveBeenCalledWith(7)
  })
})
