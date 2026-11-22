import type { RExpression } from './utility'

// ==== arena constants

export const arenaStartTime = 'arena.startTime'

export const arenaEndTime = 'arena.endTime'

// ==== arena functions

export const arenaInfo = (fileName: string, content: RExpression) => `arena.info('${fileName}', ${content})`
