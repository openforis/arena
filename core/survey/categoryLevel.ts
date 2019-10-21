import * as R from 'ramda';
import ObjectUtils from '../objectUtils';

const keys = {
  uuid: ObjectUtils.keys.uuid,
  categoryUuid: 'categoryUuid',
  index: ObjectUtils.keys.index,
  items: 'items',
  props: ObjectUtils.keys.props,
}

const keysProps = {
  name: 'name'
}

export default {
  keys,
  keysProps,

  //READ
  getUuid: ObjectUtils.getUuid,
  getIndex: R.prop(keys.index) as (x: any) => number,
  getName: ObjectUtils.getProp(keysProps.name) as (x: any) => string,
  getCategoryUuid: R.prop(keys.categoryUuid) as (x: any) => string,
};
