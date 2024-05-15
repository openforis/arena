export const RdbUpdateTypes = { insert: 'insert', update: 'update', delete: 'delete' }

export class RdbUpdates {
  constructor() {
    this.updatesBySchemaTableAndType = {}
  }

  addUpdate(update) {
    const key = RdbUpdates.extractKey(update)
    let tableUpdates = this.updatesBySchemaTableAndType[key]
    if (!tableUpdates) {
      tableUpdates = new RdbUpdatesForTable()
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

  getByKey(key) {
    return this.updatesBySchemaTableAndType[key]
  }

  getAll() {
    return Object.values(this.updatesBySchemaTableAndType).flatMap((updates) => updates.getAll())
  }

  merge(updates) {
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

RdbUpdates.extractKey = (update) => {
  const { schema, table, type } = update
  return [schema, table, type].join('|')
}

RdbUpdates.expandKey = (key) => {
  const [schema, table, type] = key.split('|')
  return { schema, table, type }
}

export class RdbUpdatesForTable {
  constructor() {
    this.updatesByRowUuid = {}
  }

  get size() {
    return Object.keys(this.updatesByRowUuid).length
  }

  getAll() {
    return Object.values(this.updatesByRowUuid)
  }

  addUpdate(update) {
    const { rowUuid } = update
    const oldUpdate = this.updatesByRowUuid[rowUuid]
    if (oldUpdate) {
      this._mergeUpdates(oldUpdate, update)
      this.updatesByRowUuid[rowUuid] = oldUpdate
    } else {
      this.updatesByRowUuid[rowUuid] = update
    }
  }

  addUpdates(updatesArray) {
    updatesArray.forEach((update) => this.addUpdate(update))
  }

  _mergeUpdates(oldUpdate, newUpdate) {
    Object.assign(oldUpdate.valuesByColumnName, newUpdate.valuesByColumnName)
  }
}
