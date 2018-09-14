const R = require('ramda')
const {uuidv4} = require('../uuid')

const newCodeList = () => ({
  uuid: uuidv4(),

  levels: [
    newCodeListLevel()
  ]
})

const newCodeListLevel = () => {
  return {
    uuid: uuidv4(),
    index: 0,
    props: {
      name: 'level_1',
    }
  }
}

const newCodeListItem = () => {
  return {
    uuid: uuidv4(),
  }
}

const getCodeListProps = R.prop('props')

const getCodeListName = R.pipe(
  getCodeListProps,
  R.prop('name'),
)

const assocCodeListProp = (key, value) => codeList => R.pipe(
  getCodeListProps,
  R.assoc(key, value),
  props => R.assoc('props', props)(codeList)
)(codeList)


module.exports = {
  //CREATE
  newCodeList,
  newCodeListLevel,
  newCodeListItem,

  //READ
  getCodeListName,

  //UPDATE
  assocCodeListProp,

}