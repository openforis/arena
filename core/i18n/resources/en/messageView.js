export default {
  body: {
    label: 'Body',
    info: `You can use **Markdown** syntax to format the message body (visit https://www.markdownguide.org for more information).  
Some placeholder variables are also available:
- \`{{userTitleAndName}}\`: replaced with user's title and name (e.g. "Mr John")
- \`{{userName}}\`: replaced with user's name (e.g. "John")`,
  },
  deleteMessage: {
    confirmTitle: 'Are you sure you want to delete this message?',
  },
  messageDeleted: 'Message deleted successfully.',
  preview: 'Preview',
  sendMessage: {
    label: 'Send Message',
    confirmTitle: 'Are you sure you want to send this message?',
  },
  status: {
    label: 'Status',
    draft: 'Draft',
    sent: 'Sent',
  },
  subject: 'Subject',
  target: {
    label: 'Target',
    emailsExcluded: {
      label: 'Excluded Emails',
      placeholder: 'Type an email address to exclude, then press Add button',
    },
    emailsIncluded: {
      label: 'Included Emails',
      placeholder: 'Type an email address to include, then press Add button',
    },
    userType: {
      all: 'All Users',
      system_admins: 'System Administrators',
      survey_managers: 'Survey Managers',
      data_editors: 'Data Editors',
      individual: 'Individual Users',
    },
  },
}
