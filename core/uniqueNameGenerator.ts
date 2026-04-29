const nameWithCountPattern = /^(.*)_(\d)$/

const parseName = (name: string): { nameWithoutCount: string; count: number } => {
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

const generateUniqueName = ({
  startingName,
  existingNames = [],
}: {
  startingName: string
  existingNames?: string[]
}): string => {
  let currentName = startingName
  let { count } = parseName(startingName)
  const { nameWithoutCount } = parseName(startingName)

  while (existingNames.includes(currentName)) {
    count += 1
    currentName = `${nameWithoutCount}_${count}`
  }
  return currentName
}

export const UniqueNameGenerator = {
  generateUniqueName,
}
