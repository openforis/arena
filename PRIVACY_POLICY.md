# Open Foris Arena – Privacy Policy

_Last updated: 24 November 2026_

This Privacy Policy explains how personal data is collected, used, shared and protected when you use Open Foris Arena ("Arena", "the platform", "we", "us"), the cloud-based platform for the collection, management, validation and analysis of data from field inventories and questionnaires.

By accessing or using Arena you acknowledge that you have read and understood this Privacy Policy. If you do not agree with it, please do not use the platform.

Arena is open-source software and can also be installed and operated by third parties on their own infrastructure. This policy applies to the Arena instances operated by the Open Foris team. Organizations running their own Arena instance are responsible for the personal data they process and for providing their users with their own privacy policy.

## 1. Personal data we collect

### 1.1 Data you provide

- **Access requests**: when you request access to Arena, we collect your email address, first and last name, institution, country, the purpose of your request and the name of the survey you intend to create.
- **User account**: your name, email address and password (stored only in hashed form), your preferences (e.g. language, theme, last used survey) and, optionally, a profile picture. If you enable two-factor authentication, the related secret is stored to verify your access codes. If you configure your own AI provider, its API key is stored encrypted.
- **External sign-in**: if you sign in through an external identity provider configured on the platform, we receive from it the information needed to identify you, such as your name and email address.
- **Invitations**: when a survey administrator invites a new user, the invitee's email address and the role assigned to them.
- **Survey and record data**: the surveys you design and the data you or your collaborators enter, upload or import (records, files, images, coordinates, categories, taxonomies, etc.), including the data uploaded from the Arena Mobile app.
- **Communications**: information you share when contacting the Open Foris team (e.g. through the support forum or by email).

### 1.2 Data collected automatically

- **Technical and log data**: IP address, browser type and version, operating system, date and time of access, requested pages and API calls, and error information. This data is used to operate, secure and troubleshoot the platform.
- **Activity log**: the actions performed on each survey (e.g. creating or editing node definitions, creating, editing or deleting records) together with the user who performed them, so that survey administrators can track changes.
- **Cookies**: see section 3.

### 1.3 Personal data contained in survey data

Surveys created in Arena may collect personal data about third parties (e.g. interviewees, landowners, field staff), including names, contact details, photographs or geographic locations. The survey owner (the person or organization that created and manages the survey) decides what data is collected and why, and is responsible for:

- having a valid legal basis for collecting it and informing the data subjects;
- limiting the collection to what is necessary;
- managing access by collaborators and the sharing or publication of the data.

The Open Foris team processes this data only to provide the platform service on behalf of the survey owner and does not access it for any other purpose, except when strictly necessary to provide technical support requested by the survey owner, to investigate a security incident or abuse of the platform, or when legally required (see "Requests from authorities" in section 4).

## 2. How we use personal data

Personal data is used to:

- evaluate access requests and create and manage user accounts;
- authenticate users and protect accounts (including password reset and two-factor authentication);
- provide the platform features: survey design, data entry, validation, data export, analysis and collaboration among users of the same survey;
- send service emails, such as invitations, access request notifications and password reset links;
- monitor, maintain, secure and improve the platform, including preventing abuse and diagnosing errors;
- produce aggregated and anonymous usage statistics;
- answer your questions and support requests.

Personal data is not sold, not used for advertising and not used to build profiles of users or of the people described in survey data.

## 3. Cookies and similar technologies

Arena uses:

- **Strictly necessary cookies**: a session cookie that keeps you signed in and protects your session. The platform cannot work without it; it is deleted when your session expires or you sign out.
- **Local storage**: the browser storage is used to remember interface preferences (e.g. theme, layout and table settings).
- **Analytics cookies** (when enabled): Google Analytics may be used to collect anonymous, aggregated information on how the platform is used (pages visited, time spent, browser and device type), in order to improve it.

You can configure your browser to refuse or delete cookies. Blocking strictly necessary cookies will prevent you from signing in to Arena.

## 4. Sharing of personal data and third-party services

Personal data is shared only to the extent necessary to provide the platform:

- **Other Arena users**: your name, email address and role are visible to the administrators and collaborators of the surveys you have access to; survey data is visible to users according to the permissions granted by the survey owner.
- **Service providers**: cloud hosting and file storage providers, email delivery providers and, when enabled, analytics providers process personal data on our behalf, under contractual obligations of confidentiality and security.
- **Bot protection**: Google reCAPTCHA is used in the access request form to prevent automated abuse. Google processes information about your device and behavior according to its own privacy policy.
- **Map and geospatial services**: when you use the map features, your browser requests map tiles, imagery or elevation data from third-party providers (e.g. OpenStreetMap, Esri, Carto, Planet, OpenTopoData). These providers receive the coordinates of the area being viewed and technical data such as your IP address. When you use forest and land-use analysis tools such as Whisp, the geometries you select are sent to that service.
- **AI features** (when enabled): if you use the optional AI assistance features (e.g. writing expressions, translating labels, summarizing or querying data), the text of your request and the survey content it needs are sent to the AI provider configured by the platform or by you (e.g. Anthropic, Google, OpenAI, or a server hosted by your organization). Survey administrators can limit, per survey, whether survey definitions and survey data may be sent to such providers.
- **Requests from authorities**: personal data is disclosed to a public authority only when the Open Foris team is legally required to do so (e.g. by a binding order of a competent authority), limited to the data strictly required and, where allowed, after informing the users concerned.

Third-party services process data according to their own privacy policies, which we encourage you to read. This policy does not cover external websites linked from Arena.

## 5. International transfers

Arena is a cloud service used by people in many countries. The platform runs on the infrastructure of cloud hosting providers, files may be kept in a cloud storage service and emails are sent through an email delivery provider: their data centers may be located outside your country. Personal data may therefore be transferred to, stored and processed in countries whose data protection rules differ from those of your country.

When personal data is transferred:

- it is shared only with the providers that need it to deliver the service, and only to the extent they need it;
- providers are chosen for their security and data protection commitments and process the data only on our behalf, under contractual obligations of confidentiality and security (such as standard data protection clauses, where available);
- data is always encrypted in transit (HTTPS/TLS).

The third-party services that you choose to use (e.g. map services, Whisp, AI providers; see section 4) receive data directly and may process it in other countries, according to their own policies.

If your organization requires the data to stay in a given country or region (e.g. because of national rules on data residency), you can install Arena, which is open-source, on infrastructure of your choice.

## 6. Data security

Personal data is protected with the following technical and organizational measures:

- **Encrypted connections**: all the communication between your browser and the platform uses HTTPS (TLS).
- **Authentication**: passwords are stored only as salted hashes (bcrypt) and are never visible to anyone, including the Open Foris team; two-factor authentication is available; session cookies cannot be read by scripts and password reset links expire after 7 days.
- **Access control**: survey data is accessible only to the users the survey owner has granted access to, according to their role (e.g. administrator, data editor, data analyst, viewer); actions on survey data are recorded in the activity log.
- **Protection of secrets**: credentials of external services, such as the API keys of AI providers, are stored encrypted.
- **Infrastructure**: administrative access to servers and databases is restricted to authorized members of the Open Foris team; data is backed up regularly.
- **Secure development**: the source code is open and can be reviewed by anyone; dependencies are kept up to date and scanned for known vulnerabilities.

If a security incident affecting personal data occurs, measures are taken promptly to contain it and the users concerned are informed when it is likely to put their rights at risk.

No system can be guaranteed to be completely secure. You are responsible for keeping your password confidential, enabling two-factor authentication where possible and granting survey permissions only to trusted users.

## 7. Data retention

- **User accounts** are kept until they are deleted, at your request (see section 8) or by a system administrator.
- **Access requests** that are not processed within one month are deleted automatically. Accepted and rejected requests are kept as a record of the decision, until you ask for their deletion.
- **Invitations** that are not accepted within one month expire: the invited user account, and the surveys created for it, are deleted automatically.
- **Password reset links** expire after 7 days and are then deleted.
- **Survey and record data** are kept until the survey owner deletes them. Deleted data remains in the backups of the platform until those backups are overwritten by newer ones; it is not restored, except to recover the platform after a failure.
- **Technical logs** (IP address, requests, errors) are kept only as long as needed to investigate errors and security incidents, and are then deleted.

## 8. Your rights

You have the following rights over your personal data. They are granted by many data protection laws (such as the General Data Protection Regulation in the European Union); the Open Foris team respects them for all the users of the platform, wherever they live.

- **Access**: you can ask which personal data about you is held on the platform and receive a copy of it. Most of it is already visible to you in your user profile and in the surveys you have access to.
- **Correction**: you can correct your name, email address, password, profile picture and preferences yourself in your user profile. For any other data, ask us to correct it.
- **Deletion**: you can ask for your user account and the personal data linked to it to be deleted. The data you entered in surveys belongs to those surveys: to have it deleted, contact the survey owner (see below).
- **Objection**: you can ask us to stop using your personal data for a specific purpose, for example to exclude you from the usage statistics. We will stop, unless that use is needed to provide the service you are using (e.g. your email address and password are needed to sign you in) or to protect the platform from abuse; in that case we will explain why.
- **Restriction**: you can ask us to keep your personal data but not use it, for a period of time. For example, while we check a correction you asked for, or when you need us to keep data that would otherwise be deleted, because you need it to establish or defend a legal claim.
- **Portability**: you can receive your data in a format that other software can read. You can export survey data from the platform yourself (e.g. as CSV files); for your account data, ask us.
- **Complaint**: if you think that your personal data has been handled incorrectly, contact us first, so that we can fix the problem. You may also have the right to complain to the data protection authority of your country.

To exercise these rights, contact us as described in section 11. We answer within 30 days. We may ask you to confirm your identity first (e.g. by writing from the email address of your account), to make sure we do not disclose or delete someone else's data.

Personal data contained in a survey (e.g. data about interviewees) is controlled by the owner of that survey: send requests about that data to the survey owner, who can correct or delete it directly in Arena. If you cannot reach the survey owner, contact us.

## 9. Children

Arena is intended for professional, scientific and institutional use and is not directed to children. User accounts are not knowingly created for persons under 16 years of age.

## 10. Changes to this Privacy Policy

This Privacy Policy is updated when the platform changes the way it handles personal data (e.g. a new feature that sends data to a new service) or when the applicable rules change. Each update is published here with a new "Last updated" date, and the previous versions remain available in the history of this file. Changes that reduce your rights, or that use your personal data for new purposes, are announced to users by email or in the platform before they take effect. If you keep using Arena after an update, the revised policy applies to you.

## 11. Contact

For general questions about this Privacy Policy, contact the Open Foris team through the Open Foris support forum: <https://openforis.support>. The forum is public: do not post personal data there.

To exercise your rights or for questions about your own personal data, write to <open-foris@fao.org>, from the email address of your Arena account if you have one.
