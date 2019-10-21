import * as R from 'ramda';

const keys = {
  processingChains: 'processingChains'
}

// ====== READ
export const getProcessingChains = R.propOr([], keys.processingChains)

// ====== UPDATE
export const assocProcessingChains = R.assoc(keys.processingChains)

export default {
  getProcessingChains,
  assocProcessingChains,
};
