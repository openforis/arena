import { Objects } from '@openforis/arena-core'

const getLabel = (cycle: string | null | undefined): string =>
  Objects.isEmpty(cycle) ? '-' : String(Number(cycle) + 1)

export const RecordCycle = {
  getLabel,
}
