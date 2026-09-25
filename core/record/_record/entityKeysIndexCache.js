import * as NodeDef from '@core/survey/nodeDef'

import * as Node from '../node'
import { NodeValues } from '../nodeValues'

// key attribute types whose values can be compared using a simple string key (see NodeValues.getFastEqualityKeyWithoutRecordContext);
// code attributes are not supported: the comparison of their values can depend on the record (hierarchical categories)
const supportedKeyDefTypes = new Set([
  NodeDef.nodeDefType.boolean,
  NodeDef.nodeDefType.decimal,
  NodeDef.nodeDefType.integer,
  NodeDef.nodeDefType.text,
])

const toEntryKey = ({ parentNode, childDefUuid }) => `${Node.getUuid(parentNode)}|${childDefUuid}`

// key parts are length-prefixed so that different key values can never produce the same index key
const toIndexKey = ({ survey, keyDefs, getKeyValue }) => {
  const keyParts = []
  for (const keyDef of keyDefs) {
    const { key } = NodeValues.getFastEqualityKeyWithoutRecordContext({
      survey,
      nodeDef: keyDef,
      value: getKeyValue(keyDef),
    })
    if (key === null) return null
    keyParts.push(`${key.length}:${key}`)
  }
  return keyParts.join('')
}

const haveSameDefUuids = (keyDefsA, keyDefsB) =>
  keyDefsA.length === keyDefsB.length &&
  keyDefsA.every((keyDef, index) => NodeDef.getUuid(keyDef) === NodeDef.getUuid(keyDefsB[index]))

/**
 * Cache of the indexes of multiple entities by their key values, used to find an entity among many siblings
 * without comparing the key values of every sibling (e.g. when importing data into a record with many entities).
 * Every index is built once per parent entity and child entity definition, and it's updated when new entities are added (see addEntity);
 * it's rebuilt when the number of siblings is different from the expected one (entities added or deleted without updating the index).
 * It must be used with only one record.
 */
export class EntityKeysIndexCache {
  constructor() {
    this.entriesByKey = new Map()
  }

  /**
   * Determines whether entities can be looked up using an index for the specified key definitions.
   * @param {!Array<object>} keyDefs - The key attribute definitions of the entity.
   * @returns {boolean} - True if the index can be used, false otherwise.
   */
  static canBeUsed(keyDefs) {
    return keyDefs.length > 0 && keyDefs.every((keyDef) => supportedKeyDefTypes.has(NodeDef.getType(keyDef)))
  }

  /**
   * Finds the UUIDs of the sibling entities having the specified key values.
   * The entities found must still be checked by the caller (the index can be outdated if key values have been modified).
   * @param {!object} params - The parameters.
   * @param {!object} params.survey - The survey.
   * @param {!object} params.parentNode - The parent entity of the entities to find.
   * @param {!string} params.childDefUuid - The UUID of the definition of the entities to find.
   * @param {!Array<object>} params.keyDefs - The key attribute definitions of the entities.
   * @param {!Array<object>} params.siblings - The current child entities of the parent node, with the specified definition.
   * @param {!function(object, string): object} params.getKeyAttribute - Function returning the key attribute of an entity, given its definition UUID.
   * @param {!object} params.keyValuesByDefUuid - The key values to search for, indexed by key attribute definition UUID.
   * @returns {Array<string>|null} - The UUIDs of the entities with the specified key values, or null if some key values are empty.
   */
  findEntityUuids({ survey, parentNode, childDefUuid, keyDefs, siblings, getKeyAttribute, keyValuesByDefUuid }) {
    const searchKey = toIndexKey({
      survey,
      keyDefs,
      getKeyValue: (keyDef) => keyValuesByDefUuid[NodeDef.getUuid(keyDef)],
    })
    if (searchKey === null) return null

    const entryKey = toEntryKey({ parentNode, childDefUuid })
    let entry = this.entriesByKey.get(entryKey)
    if (!entry || entry.siblingsCount !== siblings.length || !haveSameDefUuids(entry.keyDefs, keyDefs)) {
      entry = { keyDefs, siblingsCount: siblings.length, entityUuidsByKey: new Map() }
      siblings.forEach((sibling) => {
        const key = toIndexKey({
          survey,
          keyDefs,
          getKeyValue: (keyDef) => Node.getValue(getKeyAttribute(sibling, NodeDef.getUuid(keyDef))),
        })
        if (key !== null) {
          this._addToIndex({ entry, key, entityUuid: Node.getUuid(sibling) })
        }
      })
      this.entriesByKey.set(entryKey, entry)
    }
    return entry.entityUuidsByKey.get(searchKey) ?? []
  }

  /**
   * Adds a new entity to the index of its parent node (if any).
   * @param {!object} params - The parameters.
   * @param {!object} params.survey - The survey.
   * @param {!object} params.parentNode - The parent entity of the new entity.
   * @param {!object} params.entity - The new entity.
   * @param {!object} params.keyValuesByDefUuid - The key values of the new entity, indexed by key attribute definition UUID.
   * @returns {void}
   */
  addEntity({ survey, parentNode, entity, keyValuesByDefUuid }) {
    const entry = this.entriesByKey.get(toEntryKey({ parentNode, childDefUuid: Node.getNodeDefUuid(entity) }))
    if (!entry) return
    entry.siblingsCount += 1
    const key = toIndexKey({
      survey,
      keyDefs: entry.keyDefs,
      getKeyValue: (keyDef) => keyValuesByDefUuid[NodeDef.getUuid(keyDef)],
    })
    if (key !== null) {
      this._addToIndex({ entry, key, entityUuid: Node.getUuid(entity) })
    }
  }

  _addToIndex({ entry, key, entityUuid }) {
    const entityUuids = entry.entityUuidsByKey.get(key)
    if (entityUuids) {
      entityUuids.push(entityUuid)
    } else {
      entry.entityUuidsByKey.set(key, [entityUuid])
    }
  }
}
