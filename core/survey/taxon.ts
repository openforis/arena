import * as R from 'ramda';
import { uuidv4 } from '../uuid';
import ObjectUtils from '../objectUtils';

const keys = {
  uuid: ObjectUtils.keys.uuid,
  taxonomyUuid: 'taxonomyUuid',
  props: ObjectUtils.keys.props,
  vernacularNames: 'vernacularNames',
  vernacularNameUuid: 'vernacularNameUuid',
  vernacularName: 'vernacularName',
  vernacularLanguage: 'vernacularLanguage',
}

const propKeys = {
  code: 'code',
  family: 'family',
  genus: 'genus',
  scientificName: 'scientificName',
}

const unlistedCode = 'UNL'
const unknownCode = 'UNK'

// ===== CREATE
export interface ILocalizedDict { [s: string]: string; }
export interface ITaxonProps {
  code: string,
  family: string,
  genus: string,
  scientificName: string;
}
export interface ITaxon {
  uuid: string,
  taxonomyUuid: string;
  props: ITaxonProps,
  vernacularNames: ILocalizedDict;
  vernacularNameUuid?: unknown;
  vernacularName?: unknown;
  vernacularLanguage?: unknown;
}
const newTaxon: (taxonomyUuid: string, code: string, family: string, genus: string, scientificName: string, vernacularNames?: ILocalizedDict) => ITaxon
= (taxonomyUuid, code, family, genus, scientificName, vernacularNames = {}) => ({
  uuid: uuidv4(),
  taxonomyUuid,
  props: {
    code,
    family,
    genus,
    scientificName,
  },
  vernacularNames,
})

// ====== READ
const getCode = ObjectUtils.getProp(propKeys.code, '')

const getVernacularNames = R.propOr({}, keys.vernacularNames)

const getVernacularName = (lang?: string) => (taxon: ITaxon) => R.pipe(
  getVernacularNames as (obj: ITaxon) => ILocalizedDict,
  R.prop(lang),
  R.defaultTo(
    R.propOr('', keys.vernacularName, taxon)
  )
)(taxon)

const getVernacularLanguage = R.propOr('', keys.vernacularLanguage)

export default {
  keys,
  propKeys,
  unlistedCode,
  unknownCode,

  //CREATE
  newTaxon,

  //READ
  getUuid: ObjectUtils.getUuid,
  getTaxonomyUuid: R.prop(keys.taxonomyUuid),
  getCode,
  getFamily: ObjectUtils.getProp(propKeys.family, ''),
  getGenus: ObjectUtils.getProp(propKeys.genus, ''),
  getScientificName: ObjectUtils.getProp(propKeys.scientificName, ''),
  getVernacularNames,
  getVernacularName,
  getVernacularLanguage,
  getVernacularNameUuid: R.prop(keys.vernacularNameUuid),
  isUnlistedTaxon: R.pipe(getCode, R.equals(unlistedCode)),
  isUnknownTaxon: R.pipe(getCode, R.equals(unknownCode)),

  isEqual: ObjectUtils.isEqual,
};
