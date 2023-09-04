const nameWithCountPattern = /^(.*)_(\d)$/ // everything ending with _ followed by 1 or 2 decimals

const parseName = (name) => {
  const match = name.match(nameWithCountPattern)
  return match
    ? {
        nameWithoutCount: match[1],
        count: Number(match[2]),
      }
    : {
        nameWithoutCount: name,
        count: 0,
      }
}

const generateUniqueName = ({ startingName, existingNames = [] }) => {
  // extract count from startingName (suffix _NN added to the name, if it already exists)
  let currentName = startingName
  let { count, nameWithoutCount } = parseName(startingName)

  while (existingNames.includes(currentName)) {
    count += 1
    currentName = `${nameWithoutCount}_${count}`
  }
  return currentName
}

export const UniqueNameGenerator = {
  generateUniqueName,
}
