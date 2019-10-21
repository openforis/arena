import * as R from 'ramda';

const taxonomies = 'taxonomies'

// ====== READ
const getTaxonomies: (x: any) => any = R.propOr({}, taxonomies)

const getTaxonomiesArray: (x: any) => any[] = R.pipe(getTaxonomies, R.values)

const getTaxonomyByUuid: (uuid: string) => (x: any) => any = uuid => R.pipe(getTaxonomies, R.prop(uuid))

// ====== UPDATE
const assocTaxonomies = newTaxonomies => R.assoc(taxonomies, newTaxonomies)

export default {
  getTaxonomies,
  getTaxonomiesArray,
  getTaxonomyByUuid,

  assocTaxonomies,
};
