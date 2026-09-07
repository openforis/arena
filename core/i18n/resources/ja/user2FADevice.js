export default {
  authenticatorCodeOne: '認証アプリのコード1',
  authenticatorCodeTwo: '認証アプリのコード2',
  authenticatorCodeTwoInfo: '30秒待ってから2つ目のコードを入力してください',
  backupCodesRegenerated: {
    title: 'バックアップコードを再生成しました',
    message: `以下の8つのバックアップコードを安全な場所に保管してください：
{{backupCodes}}

認証アプリの端末にアクセスできなくなった場合、これらのコードでアカウントにアクセスできます。
**各バックアップコードは1回のみ使用できます**。
今しか表示されないため、**必ず今すぐ保存してください**。`,
  },
  create: {
    label: '作成',
  },
  creationSuccessful: {
    title: '2FAデバイスを作成しました',
    message: `2FAデバイス「{{deviceName}}」を作成しました。
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'デバイス「{{deviceName}}」を削除しますか？',
    error: 'デバイスの削除中にエラーが発生しました：{{message}}',
    successful: 'デバイスを削除しました',
  },
  deviceName: 'デバイス名',
  deviceNameFinal: '認証アプリに表示されるデバイス名',
  enabled: '有効',
  error: {
    fetchDevice: 'デバイス情報の取得中にエラーが発生しました：{{message}}',
    createDevice: 'デバイスの作成中にエラーが発生しました：{{message}}',
    updateDevice: 'デバイスの更新中にエラーが発生しました：{{message}}',
    regenerateBackupCodes: 'バックアップコードの再生成中にエラーが発生しました：{{message}}',
  },
  regenerateBackupCodes: {
    label: 'バックアップコードを再生成',
    confirm: `デバイス「{{deviceName}}」のバックアップコードを再生成しますか？
以前のバックアップコードは使用できなくなります。`,
  },
  showSecretKey: 'シークレットキーを表示',
  validation: {
    label: '検証',
    successful: 'デバイスの検証に成功しました',
    error: '認証コードが無効です',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: '認証アプリをインストール',
      description: 'モバイル端末に認証アプリ（Google Authenticator、Authyなど）をインストールしてください。',
    },
    scanCode: {
      title: 'QRコードをスキャン',
      description: '認証アプリを使って、下に表示されているQRコードをスキャンしてください。',
      descriptionAlternative: '代わりに、認証アプリにシークレットキーを直接入力することもできます。',
    },
    typeAuthenticatorCodes: {
      title: '認証コードを入力',
      description: 'デバイスを検証するため、認証アプリで生成された連続する2つのコードを入力してください。',
    },
  },
}
