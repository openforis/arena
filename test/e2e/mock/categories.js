export const categories = {
  administrative_unit: {
    name: 'administrative_unit',
    label: 'Administrative Unit ',
    uuid: null,
    levels: [
      {
        name: 'country',
        codes: 1,
      },
      {
        name: 'region',
        codes: 2,
      },
      {
        name: 'province',
        codes: 3,
      },
    ],
  },
}

const _createItems = (category, levelIdx = 0, codePrefix = '') => {
  const level = category.levels[levelIdx]
  const itemsIdx = Array.from(Array(level.codes).keys())
  const items = itemsIdx.map((itemIdx) => {
    const code = `${codePrefix}${itemIdx}`
    return {
      code,
      label: `${level.name} ${code}`,
    }
  })

  const levelIdxNext = levelIdx + 1
  if (category.levels[levelIdxNext]) {
    itemsIdx.forEach((itemIdx) => {
      items.push(..._createItems(category, levelIdxNext, `${codePrefix}${itemIdx}`))
    })
  }

  return items
}

export const categoryItems = Object.values(categories).reduce(
  (items, category) => ({ ...items, [category.name]: _createItems(category) }),
  {}
)
