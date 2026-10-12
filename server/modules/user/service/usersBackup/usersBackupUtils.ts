export const groupByUserUuid = <T extends { userUuid: string }>(items: T[]): Record<string, T[]> => {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const userItems = result[item.userUuid] ?? []
    userItems.push(item)
    result[item.userUuid] = userItems
  }
  return result
}

// surveys are matched by name between servers
export const surveyGroupKey = ({ surveyName, name }: { surveyName?: string | null; name: string }) =>
  `${surveyName}|${name}`
