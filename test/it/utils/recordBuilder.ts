import * as R from 'ramda'

import db from '../../../server/db/db'

import Survey from '../../../core/survey/survey'
import NodeDef from '../../../core/survey/nodeDef'
import Record from '../../../core/record/record'
import Node, { INode } from '../../../core/record/node'

import RecordManager from '../../../server/modules/record/manager/recordManager'

import RecordUtils from '../utils/recordUtils'
import { SurveyCycleKey } from '../../../core/survey/_survey/surveyInfo'

interface IBuilder {
  buildAndStore(user: any, survey: any, record: any, node: any, t: any): any
  build (survey, parentNodeDef, recordUuid, parentNode): { [uuid: string]: INode; };
}

export interface IRecord {
  uuid: string;
  ownerUuid: string;
  step: string;
  cycle: SurveyCycleKey;
  dateCreated: string;
  preview: boolean;
  surveyUuid: string;
  surveyId: string;
  validation: { valid: true; fields: {}; errors: []; warnings: [] };
  nodes: {
    [uuid: string]: {
      id: string;
      uuid: string;
      recordUuid: string;
      parentUuid: string;
      nodeDefUuid: string;
      value: any;
      dateCreated: Date;
      dateModified: Date;
      refData: any | null;
      meta: Object[]
    }
  }
}

class NodeBuilder {
	public nodeDefName: any;

  constructor (nodeDefName) {
    this.nodeDefName = nodeDefName
  }

}

class EntityBuilder extends NodeBuilder implements IBuilder {
	public childBuilders: IBuilder[];

  constructor (nodeDefName, ...childBuilders) {
    super(nodeDefName)
    this.childBuilders = childBuilders
  }

  build (survey, parentNodeDef, recordUuid, parentNode) {
    const nodeDef = parentNodeDef
      ? Survey.getNodeDefChildByName(parentNodeDef, this.nodeDefName)(survey)
      : Survey.getNodeDefRoot(survey)

    const entity = Node.newNode(NodeDef.getUuid(nodeDef), recordUuid, parentNode)

    return R.pipe(
      R.map((childBuilder: IBuilder) => childBuilder.build(survey, nodeDef, recordUuid, entity)),
      R.mergeAll,
      R.assoc(Node.getUuid(entity), entity)
    )(this.childBuilders)
  }

  async buildAndStore (user, survey, record, parentNode, t) {
    const nodeDef = Survey.getNodeDefByName(this.nodeDefName)(survey)

    let node
    if (NodeDef.isRoot(nodeDef)) {
      node = Record.getRootNode(record)
    } else if (NodeDef.isSingle(nodeDef)) {
      node = R.head(Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record))
    } else {
      node = Node.newNode(NodeDef.getUuid(nodeDef), Record.getUuid(record), parentNode)
      record = await RecordManager.persistNode(user, survey, record, node, null, null, t)
    }

    for (const childBuilder of this.childBuilders) {
      record = await childBuilder.buildAndStore(user, survey, record, node, t)
    }

    return record
  }
}

class AttributeBuilder extends NodeBuilder implements IBuilder {
	public value: any;

  constructor (nodeDefName: string, value: any = null) {
    super(nodeDefName)
    this.value = value
  }

  build (survey, parentNodeDef, recordUuid, parentNode) {
    const nodeDef = Survey.getNodeDefByName(this.nodeDefName)(survey)
    const attribute = Node.newNode(NodeDef.getUuid(nodeDef), recordUuid, parentNode, this.value)

    return {
      [Node.getUuid(attribute)]: attribute
    }
  }

  async buildAndStore (user, survey, record, parentNode, t) {
    const nodeDef = Survey.getNodeDefByName(this.nodeDefName)(survey)

    if (NodeDef.isReadOnly(nodeDef))
      return record

    const nodeInRecord = NodeDef.isSingle(nodeDef)
      ? R.head(Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record))
      : null

    const nodeToPersist = nodeInRecord
      ? Node.assocValue(this.value)(nodeInRecord)
      : Node.newNode(NodeDef.getUuid(nodeDef), Record.getUuid(record), parentNode, this.value)

    return await RecordManager.persistNode(user, survey, record, nodeToPersist, null, null, t)
  }

}

class RecordBuilder {
	public survey: any;
	public user: any;
	public rootEntityBuilder: any;

  constructor (user, survey, rootEntityBuilder) {
    this.survey = survey
    this.user = user
    this.rootEntityBuilder = rootEntityBuilder
  }

  build () {
    const record = RecordUtils.newRecord(this.user)
    const nodes = this.rootEntityBuilder.build(this.survey, null, Record.getUuid(record), null)
    return Record.assocNodes(nodes)(record)
  }

  async buildAndStore (client: any = db): Promise<IRecord> {
    return await client.tx(async t => {
      const record = await RecordUtils.insertAndInitRecord(this.user, this.survey, false, t)

      return await this.rootEntityBuilder.buildAndStore(this.user, this.survey, record, null, t)
    })
  }
}

export const record = (user, survey, rootEntityBuilder) => new RecordBuilder(user, survey, rootEntityBuilder)
export const entity = (nodeDefName: string, ...childBuilders: IBuilder[]) => new EntityBuilder(nodeDefName, ...childBuilders)
export const attribute = (nodeDefName: string, value: any = null) => new AttributeBuilder(nodeDefName, value)
