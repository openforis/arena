import axios from 'axios'

type PoolCommand = { command: string; payload: Record<string, unknown> }

type PoolPost = (
  url: string,
  data: PoolCommand,
  config: { headers: Record<string, string | undefined> }
) => Promise<{ data: unknown }>

type SendPoolCommandParams = {
  command: PoolCommand
  poolServerUrl?: string
  poolServiceKey?: string
  post?: PoolPost
}

/**
 * Sends a command to the RStudio pool server.
 * Without a pool server the result is empty, so the client falls back to the same-origin /rstudio/ instance.
 *
 * @param {SendPoolCommandParams} params - The command, the pool server settings and the HTTP post function.
 * @returns {Promise<unknown>} The pool server response data, or an empty object when no pool server is configured.
 */
export const sendPoolCommand = async ({
  command,
  poolServerUrl,
  poolServiceKey,
  post = axios.post,
}: SendPoolCommandParams): Promise<unknown> => {
  if (!poolServerUrl) return {}

  const { data } = await post(poolServerUrl, command, {
    headers: { 'Content-Type': 'application/json', Authorization: poolServiceKey },
  })
  return data
}
