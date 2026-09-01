const separator = '/'
const dir = {
  activityLog: 'activitylog',
  categories: 'categories',
  chains: 'chains',
  files: 'files',
  records: 'records',
  surveyFiles: 'surveyfiles',
  taxonomies: 'taxonomies',
  users: 'users',
  userProfilePictures: ['users', 'profilepictures'].join(separator),
}

const path = (...parts) => parts.join(separator)

export const ExportFile = {
  activityLog: ({ index }) => path(dir.activityLog, `activityLog_${index}.json`),
  categories: path(dir.categories, 'categories.json'),
  categoryItemsSingleFile: ({ categoryUuid }) => path(dir.categories, `${categoryUuid}.json`),
  categoryItemsPart: ({ categoryUuid, index }) => path(dir.categories, `${categoryUuid}_${index}.json`),
  chains: path(dir.chains, 'chains.json'),
  chain: ({ chainUuid }) => path(dir.chains, `${chainUuid}.json`),
  filesDir: dir.files,
  filesSummaries: path(dir.files, 'files.json'),
  file: ({ fileUuid }) => path(dir.files, `${fileUuid}.bin`),
  info: 'info.json',
  records: path(dir.records, 'records.json'),
  record: ({ recordUuid }) => path(dir.records, `${recordUuid}.json`),
  survey: 'survey.json',
  surveyFile: ({ fileUuid }) => path(dir.surveyFiles, `${fileUuid}.bin`),
  taxonomies: path(dir.taxonomies, 'taxonomies.json'),
  taxa: ({ taxonomyUuid }) => path(dir.taxonomies, `${taxonomyUuid}.json`),
  taxaPart: ({ taxonomyUuid, index }) => path(dir.taxonomies, `${taxonomyUuid}_${index}.json`),
  users: path(dir.users, 'users.json'),
  userInvitations: path(dir.users, 'userInvitations.json'),
  userProfilePicture: ({ userUuid }) => path(dir.userProfilePictures, userUuid),

  // Deprecated (old export format)
  fileOld: ({ fileUuid }) => [dir.files, `${fileUuid}.json`].join(separator),
}
