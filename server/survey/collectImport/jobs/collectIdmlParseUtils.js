const R = require('ramda')

const toLabels = (labelSource, defaultLang, typeFilter = null) => {
  const list = getList(labelSource)

  return R.reduce((acc, l) => {
    if (R.is(Object, l)) {
      const lang = R.pathOr(defaultLang, ['_attr', 'xml:lang'], l)
      const type = R.path(['_attr', 'type'], l)

      if (typeFilter === null || type === typeFilter) {
        return R.assoc(lang, l._text, acc)
      } else {
        return acc
      }
    } else {
      return R.assoc(defaultLang, l, acc)
    }
  }, {}, list)
}

const getList = R.pipe(
  R.defaultTo([]),
  R.ifElse(
    R.is(Array),
    R.identity,
    l => [l]
  )
)

module.exports = {
  toLabels,
  getList,
}