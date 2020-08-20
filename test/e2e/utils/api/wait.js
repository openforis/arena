import { waitFor as waitForTaiko } from 'taiko'

export const waitFor = waitForTaiko

export const waitFor1sec = async () => waitFor(1000)
