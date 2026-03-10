const sequelize = require('../config/database');

// Importar todos os modelos
const User = require('./User');
const Event = require('./Event');
const Participant = require('./Participant');
const Enrollment = require('./Enrollment');
const Badge = require('./Badge');
const Certificate = require('./Certificate');
const BadgeTemplate = require('./BadgeTemplate');
const EmailLog = require('./EmailLog');

// ── ASSOCIAÇÕES ──

// User cria Events
User.hasMany(Event, { foreignKey: 'created_by', as: 'events' });
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User cria BadgeTemplates
User.hasMany(BadgeTemplate, { foreignKey: 'created_by', as: 'templates' });
BadgeTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Event tem muitos Enrollments
Event.hasMany(Enrollment, { foreignKey: 'event_id', as: 'enrollments' });
Enrollment.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Participant tem muitos Enrollments
Participant.hasMany(Enrollment, { foreignKey: 'participant_id', as: 'enrollments' });
Enrollment.belongsTo(Participant, { foreignKey: 'participant_id', as: 'participant' });

// Enrollment gera um Badge (0..1)
Enrollment.hasOne(Badge, { foreignKey: 'enrollment_id', as: 'badge' });
Badge.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });

// Enrollment gera um Certificate (0..1)
Enrollment.hasOne(Certificate, { foreignKey: 'enrollment_id', as: 'certificate' });
Certificate.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });

// BadgeTemplate usado em muitos Badges
BadgeTemplate.hasMany(Badge, { foreignKey: 'template_id', as: 'badges' });
Badge.belongsTo(BadgeTemplate, { foreignKey: 'template_id', as: 'template' });

// Certificate tem muitos EmailLogs
Certificate.hasMany(EmailLog, { foreignKey: 'certificate_id', as: 'emailLogs' });
EmailLog.belongsTo(Certificate, { foreignKey: 'certificate_id', as: 'certificate' });

module.exports = {
  sequelize,
  User,
  Event,
  Participant,
  Enrollment,
  Badge,
  Certificate,
  BadgeTemplate,
  EmailLog
};