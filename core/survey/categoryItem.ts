import * as R from 'ramda';
import { uuidv4 } from '../uuid';
import ObjectUtils from '../objectUtils';
import { ILocalizedDict } from './taxon';

const keys = {
  uuid: 'uuid',
  props: 'props',
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid'
}

const props = {
  code: 'code',
  extra: 'extra',
}

const keysExtraDef = {
  dataType: 'dataType'
}

export interface ICategoryItemProps {
  code?: string;
  extra?: any;

  labels?: ILocalizedDict; // TODO should this be here
}
export interface ICategoryItem {
  uuid: string;
  levelUuid: string;
  parentUuid: string | null;
  props: ICategoryItemProps;
}
// ====== CREATE
const newItem: (levelUuid: string, parentItemUuid?: string | null, props?: ICategoryItemProps) => ICategoryItem
= (levelUuid, parentItemUuid = null, props = {}) => ({
  uuid: uuidv4(),
  levelUuid,
  parentUuid: parentItemUuid,
  props,
})

// ====== READ
const getCode: (x: ICategoryItem) => string = ObjectUtils.getProp(props.code, '')

const getLabel: (language: string) => (item: ICategoryItem) => string
= language => item => ObjectUtils.getLabel(language, getCode(item))(item)

export default {
  keys,
  props,
  keysExtraDef,

  //CREATE
  newItem,

  //READ
  getUuid: ObjectUtils.getUuid,
  getLevelUuid: R.prop(keys.levelUuid) as (x: any) => string,
  getParentUuid: R.prop(keys.parentUuid) as (x: any) => string,
  getCode,
  getLabels: ObjectUtils.getLabels,
  getLabel ,
  getDescriptions: ObjectUtils.getDescriptions,
  getDescription: ObjectUtils.getDescription,

  isEqual: ObjectUtils.isEqual,

  // NOT USED YET
  getExtraProp: prop => R.pipe(
    // @ts-ignore TODO 'extra' does not exist yet
    ObjectUtils.getProp(keys.extra),
    R.propOr('', prop)
  ),

};
