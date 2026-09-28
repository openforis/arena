export default {
  title: 'Arena の新機能',
  since: 'バージョン {{version}} 以降',
  experimental: '試験運用',
  dontShowAgain: '今後表示しない',
  slideCounter: '{{current}} / {{total}}',
  noItems: '表示する新機能はありません。',
  items: {
    dataQueryAiGenerate: {
      title: 'AI でデータエクスプローラーのクエリを作成',
      description: `**データエクスプローラー**で、探しているデータを自然な言葉で説明すると（例：*「各州の樹種別の本数」*）、AI がクエリを作成します。

クエリを保存するときに、AI が名前と説明を提案することもできます。

*ユーザープロフィールで AI 機能を有効にする必要があります。*`,
    },
    recordPrint: {
      title: 'レコードの印刷',
      description: `レコードエディターの PDF ボタンから、レコードを印刷用の **Word** または **PDF** ドキュメント（画像を含む）としてエクスポートできます。

ページの向き（縦・横）を選択できます。`,
    },
    attributeClone: {
      title: 'フォームデザイナーでの属性の複製',
      description: `**フォームデザイナー**で属性のメニューを使い、同じエンティティまたは別のエンティティに**複製**できます。すべてのプロパティがコピーされます。`,
    },
    odkImport: {
      title: 'ODK からの調査とデータのインポート',
      description: `**ODK フォーム（.xml）**から新しい調査を作成し、**ODK Collect** で収集したデータをインポートできます。

*この機能はベータ版です。*`,
    },
    dynamicEnumerator: {
      title: 'エンティティの動的な列挙',
      description: `**式**を使って、列挙された複数エンティティの行を生成するカテゴリ項目を選択できます。例：\`unique(plot.land_use)\` は、プロットで実際に記録された土地利用についてのみ行を作成します。`,
    },
  },
}
