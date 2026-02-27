export default {
  authenticatorCodeOne: 'Código do autenticador 1',
  authenticatorCodeTwo: 'Código do autenticador 2',
  authenticatorCodeTwoInfo: 'Aguarde 30 segundos e informe um segundo código',
  backupCodesRegenerated: {
    title: 'Códigos de backup regenerados com sucesso',
    message: `Salve os 8 códigos de backup abaixo em um local seguro:  
{{backupCodes}}  

Use-os para acessar sua conta caso você perca acesso ao seu dispositivo autenticador.  
**Cada código de backup pode ser usado apenas uma vez**.  
Eles só podem ser visualizados agora, então certifique-se de **salvá-los agora**.`,
  },
  create: {
    label: 'Criar',
  },
  creationSuccessful: {
    title: 'Dispositivo 2FA criado com sucesso',
    message: `2FA device "{{deviceName}}" has been created.  
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Tem certeza de que deseja excluir o dispositivo "{{deviceName}}"?',
    error: 'Erro ao excluir dispositivo: {{message}}',
    successful: 'Dispositivo excluído com sucesso',
  },
  deviceName: 'Nome do dispositivo',
  deviceNameFinal: 'Nome do dispositivo exibido no app autenticador',
  enabled: 'Habilitado',
  error: {
    fetchDevice: 'Erro ao buscar detalhes do dispositivo: {{message}}',
    createDevice: 'Erro ao criar dispositivo: {{message}}',
    updateDevice: 'Erro ao atualizar dispositivo: {{message}}',
    regenerateBackupCodes: 'Erro ao regenerar códigos de backup: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Regenerar códigos de backup',
    confirm: `Tem certeza de que deseja regenerar os códigos de backup para o dispositivo "{{deviceName}}"?  
Os códigos de backup anteriores não funcionarão mais.`,
  },
  showSecretKey: 'Mostrar chave secreta',
  validation: {
    label: 'Validar',
    successful: 'Dispositivo validado com sucesso',
    error: 'Códigos do autenticador inválidos',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Instalar app autenticador',
      description: 'Instale um app autenticador no seu dispositivo móvel (ex.: Google Authenticator, Authy etc.).',
    },
    scanCode: {
      title: 'Escanear código QR',
      description: 'Use o app autenticador para escanear o código QR exibido abaixo.',
      descriptionAlternative: 'Alternativamente, você pode inserir a chave secreta no app autenticador.',
    },
    typeAuthenticatorCodes: {
      title: 'Informar códigos do autenticador',
      description: 'Informe dois códigos consecutivos gerados pelo app autenticador para validar o dispositivo.',
    },
  },
}
