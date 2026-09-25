import type { Node as ArenaNode, NodeDef as ArenaNodeDef } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import * as Node from '../node'
import { NodeValues } from '../nodeValues'

type KeyDef = ArenaNodeDef<any>

type KeyAttributeGetter = (entity: ArenaNode, keyDefUuid: string) => ArenaNode | undefined

type Entry = {
  keyDefs: KeyDef[]
  siblingsCount: number
  entityUuidsByKey: Map<string, string[]>
  usable: boolean
}

type CompositeKey = { supported: boolean; key: string | null }

const toEntryKey = ({ parentNode, childDefUuid }: { parentNode: ArenaNode; childDefUuid: string }): string =>
  `${Node.getUuid(parentNode)}|${childDefUuid}`

// key values are compared with record context (see RecordReader.findChildByKeyValues)
const getCompositeKey = ({
  keyDefs,
  getKeyValue,
}: {
  keyDefs: KeyDef[]
  getKeyValue: (keyDef: KeyDef) => any
}): CompositeKey =>
  NodeValues.getFastEqualityCompositeKey({
    nodeDefs: keyDefs,
    getKey: (keyDef: KeyDef) =>
      NodeValues.getFastEqualityKeyInRecordContext({ nodeDef: keyDef, value: getKeyValue(keyDef) }),
  })

const getEntityCompositeKey = ({
  keyDefs,
  entity,
  getKeyAttribute,
}: {
  keyDefs: KeyDef[]
  entity: ArenaNode
  getKeyAttribute: KeyAttributeGetter
}): CompositeKey =>
  getCompositeKey({
    keyDefs,
    getKeyValue: (keyDef) => Node.getValue(getKeyAttribute(entity, NodeDef.getUuid(keyDef))),
  })

const haveSameDefUuids = (keyDefsA: KeyDef[], keyDefsB: KeyDef[]): boolean =>
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
  private readonly entriesByKey: Map<string, Entry> = new Map()

  /**
   * Determines whether entities can be looked up using an index for the specified key definitions.
   * @param keyDefs - The key attribute definitions of the entity.
   * @returns True if the index can be used, false otherwise.
   */
  static canBeUsed(keyDefs: KeyDef[]): boolean {
    return (
      keyDefs.length > 0 &&
      keyDefs.every((keyDef) => NodeValues.isTypeFastIndexableInRecordContext(NodeDef.getType(keyDef)))
    )
  }

  /**
   * Finds the UUIDs of the sibling entities having the specified key values.
   * The entities found must still be checked by the caller (the index can be outdated if key values have been modified).
   * @param params - The parameters.
   * @param params.parentNode - The parent entity of the entities to find.
   * @param params.childDefUuid - The UUID of the definition of the entities to find.
   * @param params.keyDefs - The key attribute definitions of the entities.
   * @param params.siblings - The current child entities of the parent node, with the specified definition.
   * @param params.getKeyAttribute - Function returning the key attribute of an entity, given its definition UUID.
   * @param params.keyValuesByDefUuid - The key values to search for, indexed by key attribute definition UUID.
   * @returns The UUIDs of the entities with the specified key values,
   * or null if the index cannot be used (some key values are empty or their key cannot be determined).
   */
  findEntityUuids({
    parentNode,
    childDefUuid,
    keyDefs,
    siblings,
    getKeyAttribute,
    keyValuesByDefUuid,
  }: {
    parentNode: ArenaNode
    childDefUuid: string
    keyDefs: KeyDef[]
    siblings: ArenaNode[]
    getKeyAttribute: KeyAttributeGetter
    keyValuesByDefUuid: Record<string, any>
  }): string[] | null {
    const { key: searchKey } = getCompositeKey({
      keyDefs,
      getKeyValue: (keyDef) => keyValuesByDefUuid[NodeDef.getUuid(keyDef)],
    })
    if (searchKey === null) return null

    const entryKey = toEntryKey({ parentNode, childDefUuid })
    let entry = this.entriesByKey.get(entryKey)
    if (!entry || entry.siblingsCount !== siblings.length || !haveSameDefUuids(entry.keyDefs, keyDefs)) {
      entry = this.buildEntry({ keyDefs, siblings, getKeyAttribute })
      this.entriesByKey.set(entryKey, entry)
    }
    if (!entry.usable) return null

    return entry.entityUuidsByKey.get(searchKey) ?? []
  }

  /**
   * Adds a new entity to the index of its parent node (if any).
   * @param params - The parameters.
   * @param params.parentNode - The parent entity of the new entity.
   * @param params.entity - The new entity (with its key attributes).
   * @param params.getKeyAttribute - Function returning the key attribute of an entity, given its definition UUID.
   */
  addEntity({
    parentNode,
    entity,
    getKeyAttribute,
  }: {
    parentNode: ArenaNode
    entity: ArenaNode
    getKeyAttribute: KeyAttributeGetter
  }): void {
    const entry = this.entriesByKey.get(toEntryKey({ parentNode, childDefUuid: Node.getNodeDefUuid(entity) }))
    if (!entry) return
    entry.siblingsCount += 1
    if (!entry.usable) return

    const { supported, key } = getEntityCompositeKey({ keyDefs: entry.keyDefs, entity, getKeyAttribute })
    if (!supported) {
      entry.usable = false
    } else if (key !== null) {
      this.addToIndex({ entry, key, entityUuid: Node.getUuid(entity) })
    }
  }

  private buildEntry({
    keyDefs,
    siblings,
    getKeyAttribute,
  }: {
    keyDefs: KeyDef[]
    siblings: ArenaNode[]
    getKeyAttribute: KeyAttributeGetter
  }): Entry {
    const entry: Entry = { keyDefs, siblingsCount: siblings.length, entityUuidsByKey: new Map(), usable: true }
    for (const sibling of siblings) {
      const { supported, key } = getEntityCompositeKey({ keyDefs, entity: sibling, getKeyAttribute })
      if (!supported) {
        // the key values of this sibling can be compared only using the record: the index cannot be used
        entry.usable = false
        entry.entityUuidsByKey = new Map()
        return entry
      }
      if (key !== null) {
        this.addToIndex({ entry, key, entityUuid: Node.getUuid(sibling) })
      }
    }
    return entry
  }

  private addToIndex({ entry, key, entityUuid }: { entry: Entry; key: string; entityUuid: string }): void {
    const entityUuids = entry.entityUuidsByKey.get(key)
    if (entityUuids) {
      entityUuids.push(entityUuid)
    } else {
      entry.entityUuidsByKey.set(key, [entityUuid])
    }
  }
}
