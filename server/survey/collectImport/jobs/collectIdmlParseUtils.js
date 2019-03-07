const R = require('ramda')

const toLabels = (labelSource, defaultLang, typeFilter = null) => {
  const list = toList(labelSource)

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

const toList = R.pipe(
  R.defaultTo([]),
  R.ifElse(
    R.is(Array),
    R.identity,
    l => [l]
  )
)

const getList = path => R.pipe(
  R.path(path),
  toList
)

module.exports = {
  toLabels,
  toList,
  getList,
}