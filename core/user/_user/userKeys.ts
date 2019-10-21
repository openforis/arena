import ObjectUtils from '../../objectUtils';

const keys = {
  uuid: ObjectUtils.keys.uuid,
  name: ObjectUtils.keys.name,
  email: 'email',
  lang: 'lang',
  authGroups: ObjectUtils.keys.authGroups,
  hasProfilePicture: 'hasProfilePicture',
  prefs: 'prefs',
}

export interface IUser {
  uuid: string;
  name: string;
  email: string;
  lang: string;
  authGroups: any[];
  hasProfilePicture: boolean;
  prefs: any;
}

export default keys;
