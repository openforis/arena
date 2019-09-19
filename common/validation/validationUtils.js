const Validation = require('./validation')

const keys = {
  validation: 'validation'
}

const getValidation = R.propOr(Validation.newInstance(), keys.validation)

const assocValidation = R.assoc(keys.validation)

const assocFieldValidation = (field, fieldValidation) => obj => R.pipe(
  getValidation,
  Validation.assocFieldValidation(field, fieldValidation),
  validationUpdated => assocValidation(validationUpdated)(obj)
)(obj)

const dissocFieldValidation = field => obj => R.pipe(
  getValidation,
  Validation.dissocFieldValidation(field),
  assocValidation
)(obj)


module.exports = {
  getValidation,

  assocValidation,
  assocFieldValidation,
  dissocFieldValidation
}