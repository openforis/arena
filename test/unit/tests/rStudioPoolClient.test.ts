import { sendPoolCommand } from '@server/modules/rstudio/api/rStudioPoolClient'

const command = { command: 'REQUEST_RSTUDIO', payload: { userId: 'user-uuid' } }

describe('RStudio pool client', () => {
  test('returns an empty result without calling the pool when no pool server is configured', async () => {
    const post = jest.fn()

    const result = await sendPoolCommand({ command, poolServerUrl: undefined, poolServiceKey: undefined, post })

    expect(result).toEqual({})
    expect(post).not.toHaveBeenCalled()
  })

  test('treats an empty pool server URL as not configured', async () => {
    const post = jest.fn()

    const result = await sendPoolCommand({ command, poolServerUrl: '', poolServiceKey: 'key', post })

    expect(result).toEqual({})
    expect(post).not.toHaveBeenCalled()
  })

  test('posts the command to the pool server and returns its response data', async () => {
    const data = { instanceId: 'instance-1', rStudioProxyUrl: 'https://rstudio.example.org/' }
    const post = jest.fn().mockResolvedValue({ data })

    const result = await sendPoolCommand({
      command,
      poolServerUrl: 'https://pool.example.org',
      poolServiceKey: 'service-key',
      post,
    })

    expect(result).toEqual(data)
    expect(post).toHaveBeenCalledWith('https://pool.example.org', command, {
      headers: { 'Content-Type': 'application/json', Authorization: 'service-key' },
    })
  })
})
