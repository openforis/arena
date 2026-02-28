export default {
  body: {
    label: 'Corpo',
    info: `Você pode usar sintaxe **Markdown** para formatar o corpo da mensagem (visite https://www.markdownguide.org para mais informações).  
Algumas variáveis de substituição também estão disponíveis:
- \`{{userTitleAndName}}\`: substituída pelo título e nome do usuário (ex.: "Sr. João")
- \`{{userName}}\`: substituída pelo nome do usuário (ex.: "João")`,
  },
  dateSent: 'Data de envio',
  dateValidUntil: 'Válido até',
  deleteMessage: {
    confirmTitle: 'Tem certeza de que deseja excluir esta mensagem?',
  },
  messageDeleted: 'Mensagem excluída com sucesso.',
  notificationType: {
    label: 'Tipo de notificação',
    email: 'Email',
    push_notification: 'Notificação no aplicativo',
  },
  preview: 'Visualizar',
  sendMessage: {
    label: 'Enviar mensagem',
    confirmTitle: 'Tem certeza de que deseja enviar esta mensagem?',
  },
  status: {
    label: 'Status',
    draft: 'Rascunho',
    sent: 'Enviada',
  },
  subject: 'Assunto',
  target: {
    emailsExcluded: {
      label: 'Emails excluídos',
      placeholder: 'Digite um email para excluir e pressione o botão Adicionar',
    },
    emailsIncluded: {
      label: 'Emails incluídos',
      placeholder: 'Digite um email para incluir e pressione o botão Adicionar',
    },
    userType: {
      label: 'Tipo de usuário alvo',
      all: 'Todos os usuários',
      system_admins: 'Administradores do sistema',
      survey_managers: 'Gerentes de inventário',
      data_analysts: 'Analistas de dados',
      data_cleaners: 'Revisores de dados',
      data_editors: 'Editores de dados',
      individual: 'Usuários individuais',
    },
  },
}
