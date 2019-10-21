import * as R from 'ramda';
import { ITaxon } from '../survey/taxon';
import { ICategoryItem } from '../survey/categoryItem';

const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
}

interface IRefData {}

const getRefData: (x: any) => IRefData = R.propOr({}, keys.refData)
const getRefDataProp: (key: string) => (x: any) => any = key => R.pipe(getRefData, R.prop(key))

const getTaxon: (x: IRefData) => ITaxon = getRefDataProp(keys.taxon)
const getCategoryItem: (x: IRefData) => ICategoryItem = getRefDataProp(keys.categoryItem)

const assocRefData = R.assoc(keys.refData)

export default {
  keys,

  getTaxon,
  getCategoryItem,

  assocRefData,
};
