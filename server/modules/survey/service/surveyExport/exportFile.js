import * as FileUtils from '../../../../utils/file/fileUtils'

const dir = {
  activityLog: 'activitylog',
  categories: 'categories',
  chains: 'chains',
  files: 'files',
  records: 'records',
  taxonomies: 'taxonomies',
  users: 'users',
  userProfilePictures: FileUtils.join('users', 'profilepictures'),
}

export const ExportFile = {
  activityLog: FileUtils.join(dir.activityLog, 'activityLog.json'),
  categories: FileUtils.join(dir.categories, 'categories.json'),
  categoryItems: ({ categoryUuid }) => FileUtils.join(dir.categories, `${categoryUuid}.json`),
  chains: FileUtils.join(dir.chains, 'chains.json'),
  chain: ({ chainUuid }) => FileUtils.join(dir.chains, `${chainUuid}.json`),
  filesDir: dir.files,
  file: ({ fileUuid }) => FileUtils.join(dir.files, `${fileUuid}.json`),
  records: FileUtils.join(dir.records, 'records.json'),
  record: ({ recordUuid }) => FileUtils.join(dir.records, `${recordUuid}.json`),
  survey: 'survey.json',
  taxonomies: FileUtils.join(dir.taxonomies, 'taxonomies.json'),
  taxa: ({ taxonomyUuid }) => FileUtils.join(dir.taxonomies, `${taxonomyUuid}.json`),
  users: FileUtils.join(dir.users, 'users.json'),
  userInvitations: FileUtils.join(dir.users, 'userInvitations.json'),
  userProfilePicture: ({ userUuid }) => FileUtils.join(dir.userProfilePictures, userUuid),
}
