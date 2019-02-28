const R = require('ramda')

const toLabels = (labelSource, defaultLang) => {
  const list = getList(labelSource)

  return R.reduce((acc, l) =>
      R.is(Object, l)
        ? R.assoc(l._attr['xml:lang'], l._text, acc)
        : R.assoc(defaultLang, l, acc)
    , {}, list)
}

const getList =
  R.ifElse(
    R.isNil,
    R.always([]),
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