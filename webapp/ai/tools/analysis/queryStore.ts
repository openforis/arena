export type AnalysisQueryEntry = {
  id: string
  query: object
  explanation: string
  entityName: string
  mode: string
  createdAt: string
}

export type AnalysisQueryStore = {
  add: (props: Omit<AnalysisQueryEntry, 'id' | 'createdAt'>) => AnalysisQueryEntry
  get: (id: unknown) => AnalysisQueryEntry | null
  list: () => AnalysisQueryEntry[]
}

/**
 * Creates the store of the queries proposed in one conversation (ids q1, q2, … readable by the model).
 * @param {object} [params] - Parameters.
 * @param {object} [params.queries] - Queries already in the conversation, by id.
 * @param {Function} [params.onChange] - Called with all the queries after each addition (to save the conversation).
 * @param {Function} [params.now] - Clock (ISO string).
 * @returns {AnalysisQueryStore} The store.
 */
export const createAnalysisQueryStore = ({
  queries = {},
  onChange = () => undefined,
  now = () => new Date().toISOString(),
}: {
  queries?: Record<string, AnalysisQueryEntry>
  onChange?: (queries: Record<string, AnalysisQueryEntry>) => void
  now?: () => string
} = {}): AnalysisQueryStore => {
  let entries: Record<string, AnalysisQueryEntry> = { ...queries }
  return {
    add: (props) => {
      const id = `q${Object.keys(entries).length + 1}`
      const entry = { ...props, id, createdAt: now() }
      entries = { ...entries, [id]: entry }
      onChange(entries)
      return entry
    },
    get: (id) => (typeof id === 'string' && Object.hasOwn(entries, id) ? entries[id] : null),
    list: () => Object.values(entries),
  }
}
