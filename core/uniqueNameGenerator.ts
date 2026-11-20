const nameWithCountPattern = /^(.*)_(\d)$/

const parseName = (name: string): { nameWithoutCount: string; count: number } => {
  const match = nameWithCountPattern.exec(name)
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

// truncates the name so that, with the suffix appended, it is at most maxLength characters long
const fitName = (name: string, suffix: string, maxLength?: number): string =>
  (maxLength ? name.slice(0, maxLength - suffix.length) : name) + suffix

const generateUniqueName = ({
  startingName,
  existingNames = new Set(),
  maxLength,
}: {
  startingName: string
  existingNames?: Set<string>
  maxLength?: number
}): string => {
  let currentName = fitName(startingName, '', maxLength)
  let { count } = parseName(startingName)
  const { nameWithoutCount } = parseName(startingName)

  while (existingNames.has(currentName)) {
    count += 1
    currentName = fitName(nameWithoutCount, `_${count}`, maxLength)
  }
  return currentName
}

export const UniqueNameGenerator = {
  generateUniqueName,
}
