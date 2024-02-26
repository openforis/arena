const separator = '/'
const dir = {
  activityLog: 'activitylog',
  categories: 'categories',
  chains: 'chains',
  files: 'files',
  records: 'records',
  taxonomies: 'taxonomies',
  users: 'users',
  userProfilePictures: ['users', 'profilepictures'].join(separator),
}

export const ExportFile = {
  activityLog: ({ index }) => [dir.activityLog, `activityLog_${index}.json`].join(separator),
  categories: [dir.categories, 'categories.json'].join(separator),
  categoryItemsSingleFile: ({ categoryUuid }) => [dir.categories, `${categoryUuid}.json`].join(separator),
  categoryItemsPart: ({ categoryUuid, index }) => [dir.categories, `${categoryUuid}_${index}.json`].join(separator),
  chains: [dir.chains, 'chains.json'].join(separator),
  chain: ({ chainUuid }) => [dir.chains, `${chainUuid}.json`].join(separator),
  filesDir: dir.files,
  filesSummaries: [dir.files, 'files.json'].join(separator),
  file: ({ fileUuid }) => [dir.files, `${fileUuid}.bin`].join(separator),
  records: [dir.records, 'records.json'].join(separator),
  record: ({ recordUuid }) => [dir.records, `${recordUuid}.json`].join(separator),
  survey: 'survey.json',
  taxonomies: [dir.taxonomies, 'taxonomies.json'].join(separator),
  taxa: ({ taxonomyUuid }) => [dir.taxonomies, `${taxonomyUuid}.json`].join(separator),
  users: [dir.users, 'users.json'].join(separator),
  userInvitations: [dir.users, 'userInvitations.json'].join(separator),
  userProfilePicture: ({ userUuid }) => [dir.userProfilePictures, userUuid].join(separator),

  // Deprecated (old export format)
  fileOld: ({ fileUuid }) => [dir.files, `${fileUuid}.json`].join(separator),
}
