import * as R from 'ramda';

const keys = {
  recordUuid: 'recordUuid',
}

export default {
  keys,

  getRecordUuid: R.prop(keys.recordUuid),
};
