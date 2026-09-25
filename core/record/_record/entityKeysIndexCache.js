import * as NodeDef from '@core/survey/nodeDef'

import * as Node from '../node'
import { NodeValues } from '../nodeValues'

const toEntryKey = ({ parentNode, childDefUuid }) => `${Node.getUuid(parentNode)}|${childDefUuid}`

// key values are compared with record context (see RecordReader.findChildByKeyValues)
const getCompositeKey = ({ keyDefs, getKeyValue }) =>
  NodeValues.getFastEqualityCompositeKey({
    nodeDefs: keyDefs,
    getKey: (keyDef) => NodeValues.getFastEqualityKeyInRecordContext({ nodeDef: keyDef, value: getKeyValue(keyDef) }),
  })

const getEntityCompositeKey = ({ keyDefs, entity, getKeyAttribute }) =>
  getCompositeKey({
    keyDefs,
    getKeyValue: (keyDef) => Node.getValue(getKeyAttribute(entity, NodeDef.getUuid(keyDef))),
  })

const haveSameDefUuids = (keyDefsA, keyDefsB) =>
  keyDefsA.length === keyDefsB.length &&
  keyDefsA.every((keyDef, index) => NodeDef.getUuid(keyDef) === NodeDef.getUuid(keyDefsB[index]))

/**
 * Cache of the indexes of multiple entities by their key values, used to find an entity among many siblings
 * without comparing the key values of every sibling (e.g. when importing data into a record with many entities).
 * Every index is built once per parent entity and child entity definition, and it's updated when new entities are added (see addEntity);
 * it's rebuilt when the number of siblings is different from the expected one (entities added or deleted without updating the index).
 * When the key of some value cannot be determined without comparing it using the record (see NodeValues.getFastEqualityKeyInRecordContext),
 * the index cannot be used and the entities must be found comparing the key values of every sibling.
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
    return (
      keyDefs.length > 0 &&
      keyDefs.every((keyDef) => NodeValues.isTypeFastIndexableInRecordContext(NodeDef.getType(keyDef)))
    )
  }

  /**
   * Finds the UUIDs of the sibling entities having the specified key values.
   * The entities found must still be checked by the caller (the index can be outdated if key values have been modified).
   * @param {!object} params - The parameters.
   * @param {!object} params.parentNode - The parent entity of the entities to find.
   * @param {!string} params.childDefUuid - The UUID of the definition of the entities to find.
   * @param {!Array<object>} params.keyDefs - The key attribute definitions of the entities.
   * @param {!Array<object>} params.siblings - The current child entities of the parent node, with the specified definition.
   * @param {!function(object, string): object} params.getKeyAttribute - Function returning the key attribute of an entity, given its definition UUID.
   * @param {!object} params.keyValuesByDefUuid - The key values to search for, indexed by key attribute definition UUID.
   * @returns {Array<string>|null} - The UUIDs of the entities with the specified key values,
   * or null if the index cannot be used (some key values are empty or their key cannot be determined).
   */
  findEntityUuids({ parentNode, childDefUuid, keyDefs, siblings, getKeyAttribute, keyValuesByDefUuid }) {
    const { key: searchKey } = getCompositeKey({
      keyDefs,
      getKeyValue: (keyDef) => keyValuesByDefUuid[NodeDef.getUuid(keyDef)],
    })
    if (searchKey === null) return null

    const entryKey = toEntryKey({ parentNode, childDefUuid })
    let entry = this.entriesByKey.get(entryKey)
    if (!entry || entry.siblingsCount !== siblings.length || !haveSameDefUuids(entry.keyDefs, keyDefs)) {
      entry = this._buildEntry({ keyDefs, siblings, getKeyAttribute })
      this.entriesByKey.set(entryKey, entry)
    }
    if (!entry.usable) return null

    return entry.entityUuidsByKey.get(searchKey) ?? []
  }

  /**
   * Adds a new entity to the index of its parent node (if any).
   * @param {!object} params - The parameters.
   * @param {!object} params.parentNode - The parent entity of the new entity.
   * @param {!object} params.entity - The new entity (with its key attributes).
   * @param {!function(object, string): object} params.getKeyAttribute - Function returning the key attribute of an entity, given its definition UUID.
   * @returns {void}
   */
  addEntity({ parentNode, entity, getKeyAttribute }) {
    const entry = this.entriesByKey.get(toEntryKey({ parentNode, childDefUuid: Node.getNodeDefUuid(entity) }))
    if (!entry) return
    entry.siblingsCount += 1
    if (!entry.usable) return

    const { supported, key } = getEntityCompositeKey({ keyDefs: entry.keyDefs, entity, getKeyAttribute })
    if (!supported) {
      entry.usable = false
    } else if (key !== null) {
      this._addToIndex({ entry, key, entityUuid: Node.getUuid(entity) })
    }
  }

  _buildEntry({ keyDefs, siblings, getKeyAttribute }) {
    const entry = { keyDefs, siblingsCount: siblings.length, entityUuidsByKey: new Map(), usable: true }
    for (const sibling of siblings) {
      const { supported, key } = getEntityCompositeKey({ keyDefs, entity: sibling, getKeyAttribute })
      if (!supported) {
        // the key values of this sibling can be compared only using the record: the index cannot be used
        entry.usable = false
        entry.entityUuidsByKey = new Map()
        return entry
      }
      if (key !== null) {
        this._addToIndex({ entry, key, entityUuid: Node.getUuid(sibling) })
      }
    }
    return entry
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
