export default {
  body: {
    label: 'Cuerpo',
    info: `Puede usar la sintaxis de [Markdown](https://www.markdownguide.org) para formatear el cuerpo del mensaje.  
Algunas variables de marcador de posición también están disponibles:
- \`{{userTitleAndName}}\`: reemplazado con el título y nombre del usuario (p. ej., "Sr. Juan")
- \`{{userName}}\`: reemplazado con el nombre del usuario (p. ej., "Juan")`,
  },
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
    all: 'Todos los usuarios',
    system_admins: 'Administradores del sistema',
    survey_managers: 'Gestores de encuestas',
    data_editors: 'Editores de datos',
  },
}
