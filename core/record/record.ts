import * as R from 'ramda';
import ObjectUtils from '../objectUtils';
import { uuidv4 } from './../uuid';
import Validation from '../validation/validation';
import User from '../user/user';
import RecordStep from './recordStep';
import keys from './_record/recordKeys';
import RecordReader from './_record/recordReader';
import RecordUpdater from './_record/recordUpdater';

// ====== CREATE

export interface IRecord {
  uuid: string;
  ownerUuid: string;
  step: string; // step id really?
  cycle: string;
  preview: boolean;
  dateCreated: string | null; // TODO
}
const newRecord: (user: any, cycle: string, preview?: boolean, dateCreated?: string | null) => IRecord
= (user, cycle, preview = false, dateCreated = null) => ({
    uuid: uuidv4(),
  ownerUuid: User.getUuid(user),
  step: RecordStep.getDefaultStep(),
  cycle: cycle,
  preview: preview,
  dateCreated: dateCreated,
})

export default {
  keys,

  // ====== CREATE
  newRecord,

  // ====== READ
  getSurveyUuid: R.prop(keys.surveyUuid),

  getUuid: ObjectUtils.getUuid,
  isPreview: R.propEq(keys.preview, true) as (x: any) => boolean,
  getOwnerUuid: R.prop(keys.ownerUuid) as (x: any) => string,
  getOwnerName: R.prop(keys.ownerName) as (x: any) => string, // TODO: add ownerName to IRecord?
  getStep: R.prop(keys.step) as (x: any) => string,
  getCycle: R.prop(keys.cycle) as (x: any) => string,
  getDateCreated: ObjectUtils.getDateCreated,
  getDateModified: ObjectUtils.getDateModified,

  getNodes: RecordReader.getNodes,
  getNodeByUuid: RecordReader.getNodeByUuid,
  getRootNode: RecordReader.getRootNode,
  getNodesByDefUuid: RecordReader.getNodesByDefUuid,

  // ==== hierarchy
  getParentNode: RecordReader.getParentNode,
  getAncestorsAndSelf: RecordReader.getAncestorsAndSelf,
  getAncestorByNodeDefUuid: RecordReader.getAncestorByNodeDefUuid,

  getNodeSiblingsAndSelf: RecordReader.getNodeSiblingsAndSelf,
  getNodeChildren: RecordReader.getNodeChildren,
  getNodeChildrenByDefUuid: RecordReader.getNodeChildrenByDefUuid,
  getNodeChildByDefUuid: RecordReader.getNodeChildByDefUuid,
  visitDescendantsAndSelf: RecordReader.visitDescendantsAndSelf,
  isNodeApplicable: RecordReader.isNodeApplicable,

  // ==== dependency
  getDependentNodePointers: RecordReader.getDependentNodePointers,
  getParentCodeAttribute: RecordReader.getParentCodeAttribute,
  getDependentCodeAttributes: RecordReader.getDependentCodeAttributes,

  // ====== Keys
  getEntityKeyNodes: RecordReader.getEntityKeyNodes,
  getEntityKeyValues: RecordReader.getEntityKeyValues,

  // ====== UPDATE
  assocNodes: RecordUpdater.assocNodes,
  assocNode: RecordUpdater.assocNode,

  // ====== DELETE
  deleteNode: RecordUpdater.deleteNode,

  // ====== VALIDATION
  mergeNodeValidations: RecordUpdater.mergeNodeValidations,
  getValidation: Validation.getValidation,
};
