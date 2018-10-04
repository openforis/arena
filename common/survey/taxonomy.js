const R = require('ramda')
const {uuidv4} = require('../uuid')


const {
  setProp,
  getProp,
  toIndexedObj,
} = require('./surveyUtils')


// ====== CREATE
const newTaxonomy = () => ({
  uuid: uuidv4(),
  props: {},
})



module.exports = {
  //CREATE
  newTaxonomy,

  // UPDATE
  assocCodeListProp: setProp,

}