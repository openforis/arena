export default {
  body: {
    label: 'Cuerpo',
    info: `Puede usar la sintaxis de **Markdown** para formatear el cuerpo del mensaje (visite https://www.markdownguide.org para más información).  
Algunas variables de marcador de posición también están disponibles:
- \`{{userTitleAndName}}\`: reemplazado con el título y nombre del usuario (p. ej., "Sr. Juan")
- \`{{userName}}\`: reemplazado con el nombre del usuario (p. ej., "Juan")`,
  },
  dateSent: 'Fecha de envío',
  deleteMessage: {
    confirmTitle: '¿Está seguro de que desea eliminar este mensaje?',
  },
  messageDeleted: 'Mensaje eliminado exitosamente.',
  preview: 'Vista previa',
  sendMessage: {
    label: 'Enviar mensaje',
    confirmTitle: '¿Está seguro de que desea enviar este mensaje?',
  },
  status: {
    label: 'Estado',
    draft: 'Borrador',
    sent: 'Enviado',
  },
  subject: 'Asunto',
  target: {
    label: 'Destino',
    emailsExcluded: {
      label: 'Correos electrónicos excluidos',
      placeholder: 'Escriba una dirección de correo electrónico para excluir, luego presione el botón Agregar',
    },
    emailsIncluded: {
      label: 'Correos electrónicos incluidos',
      placeholder: 'Escriba una dirección de correo electrónico para incluir, luego presione el botón Agregar',
    },
    userType: {
      label: 'Tipo de usuario objetivo',
      all: 'Todos los usuarios',
      system_admins: 'Administradores del sistema',
      survey_managers: 'Gestores de encuestas',
      data_editors: 'Editores de datos',
      individual: 'Usuarios individuales',
    },
  },
}
