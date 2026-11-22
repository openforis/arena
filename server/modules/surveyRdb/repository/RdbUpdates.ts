export const RdbUpdateTypes = { insert: 'insert', update: 'update', delete: 'delete' }

// insert, update or delete of a row of a data table
export type RdbUpdate = {
  type: string
  schema: string
  table: string
  nodeDefUuid: string
  nodeDefHierarchyLevel: number
  rowUuid: string
  valuesByColumnName?: { [columnName: string]: unknown }
}

const executionOrderByType = {
  [RdbUpdateTypes.delete]: 1,
  [RdbUpdateTypes.insert]: 2,
  [RdbUpdateTypes.update]: 3,
}

export class RdbUpdates {
  updatesBySchemaTableAndType: Record<string, RdbUpdatesForTable>

  static readonly extractKey = (update: { schema: string; table: string; type: string }): string => {
    const { schema, table, type } = update
    return [schema, table, type].join('|')
  }

  static readonly expandKey = (key: string): { schema: string; table: string; type: string } => {
    const [schema, table, type] = key.split('|')
    return { schema, table, type }
  }

  constructor() {
    this.updatesBySchemaTableAndType = {}
  }

  addUpdate(update: RdbUpdate): void {
    const { nodeDefUuid, nodeDefHierarchyLevel } = update
    const key = RdbUpdates.extractKey(update)
    let tableUpdates = this.updatesBySchemaTableAndType[key]
    if (!tableUpdates) {
      tableUpdates = new RdbUpdatesForTable({ nodeDefUuid, nodeDefHierarchyLevel })
      this.updatesBySchemaTableAndType[key] = tableUpdates
    }
    tableUpdates.addUpdate(update)
  }

  get size() {
    return Object.values(this.updatesBySchemaTableAndType).reduce((acc, tableUpdates) => acc + tableUpdates.size, 0)
  }

  get keys() {
    return Object.keys(this.updatesBySchemaTableAndType)
  }

  get entries() {
    return Object.entries(this.updatesBySchemaTableAndType)
  }

  getByKey(key: string): RdbUpdatesForTable | undefined {
    return this.updatesBySchemaTableAndType[key]
  }

  getAll(): RdbUpdate[] {
    return Object.entries(this.updatesBySchemaTableAndType)
      .sort(([keyA, tableUpdatesA], [keyB, tableUpdatesB]) => {
        // execute updates in order, according to the type (1. delete, 2. insert, 3. update) and hierarchy level
        const { type: typeA } = RdbUpdates.expandKey(keyA)
        const { nodeDefHierarchyLevel: nodeDefHierarchyLevelA } = tableUpdatesA
        const { type: typeB } = RdbUpdates.expandKey(keyB)
        const { nodeDefHierarchyLevel: nodeDefHierarchyLevelB } = tableUpdatesB
        return (
          executionOrderByType[typeA] - executionOrderByType[typeB] || nodeDefHierarchyLevelA - nodeDefHierarchyLevelB
        )
      })
      .flatMap(([_key, updates]) => updates.getAll())
  }

  merge(updates: RdbUpdates): void {
    Object.entries(updates.updatesBySchemaTableAndType).forEach(([key, tableUpdates]) => {
      const oldTableUpdates = this.updatesBySchemaTableAndType[key]
      if (oldTableUpdates) {
        oldTableUpdates.addUpdates(tableUpdates.getAll())
      } else {
        this.updatesBySchemaTableAndType[key] = tableUpdates
      }
    })
  }
}

export class RdbUpdatesForTable {
  nodeDefHierarchyLevel: number
  nodeDefUuid: string
  updatesByRowUuid: { [rowUuid: string]: RdbUpdate }

  constructor({ nodeDefUuid, nodeDefHierarchyLevel }: { nodeDefUuid: string; nodeDefHierarchyLevel: number }) {
    this.nodeDefUuid = nodeDefUuid
    this.nodeDefHierarchyLevel = nodeDefHierarchyLevel
    this.updatesByRowUuid = {}
  }

  get size() {
    return Object.keys(this.updatesByRowUuid).length
  }

  getAll(): RdbUpdate[] {
    return Object.values(this.updatesByRowUuid)
  }

  addUpdate(update: RdbUpdate): void {
    const { rowUuid } = update
    const oldUpdate = this.updatesByRowUuid[rowUuid]
    if (oldUpdate) {
      this._mergeUpdates(oldUpdate, update)
      this.updatesByRowUuid[rowUuid] = oldUpdate
    } else {
      this.updatesByRowUuid[rowUuid] = update
    }
  }

  addUpdates(updatesArray: RdbUpdate[]): void {
    updatesArray.forEach((update) => this.addUpdate(update))
  }

  _mergeUpdates(oldUpdate: RdbUpdate, newUpdate: RdbUpdate): void {
    Object.assign(oldUpdate.valuesByColumnName, newUpdate.valuesByColumnName)
  }
}
