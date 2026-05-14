const config = require('./config');

class PermissionManager {
  constructor(database) {
    this.db = database;
  }

  // التحقق من أن المستخدم هو المطور
  isDeveloper(userId) {
    return userId === config.DEVELOPER_ID;
  }

  // التحقق من أن المستخدم هو مالك المجموعة
  isGroupOwner(userId, groupId) {
    const group = this.db.getGroup(groupId);
    return group && group.ownerId === userId;
  }

  // التحقق من أن المستخدم هو مشرف في المجموعة
  isGroupAdmin(userId, groupId) {
    const group = this.db.getGroup(groupId);
    return group && group.admins.includes(userId);
  }

  // التحقق من أن المستخدم هو مشرف أو مالك المجموعة
  isGroupAdminOrOwner(userId, groupId) {
    return this.isGroupAdmin(userId, groupId) || this.isGroupOwner(userId, groupId);
  }

  // التحقق من أن المستخدم هو مسؤول نظام (مطور)
  isSystemAdmin(userId) {
    return this.isDeveloper(userId);
  }

  // الحصول على رتبة المستخدم في مجموعة معينة
  getUserGroupRole(userId, groupId) {
    if (this.isGroupOwner(userId, groupId)) {
      return config.ROLES.GROUP_OWNER;
    }
    if (this.isGroupAdmin(userId, groupId)) {
      return config.ROLES.ADMIN;
    }
    const group = this.db.getGroup(groupId);
    if (group && group.members.includes(userId)) {
      return config.ROLES.USER;
    }
    return null;
  }

  // التحقق من الصلاحيات (صارم)
  hasPermission(userId, groupId, action) {
    const role = this.getUserGroupRole(userId, groupId);
    
    const permissions = {
      [config.ROLES.GROUP_OWNER]: [
        'view_dashboard',
        'manage_admins',
        'manage_members',
        'manage_channels',
        'view_statistics',
        'send_announcement',
        'manage_settings',
        'create_channel',
        'delete_channel'
      ],
      [config.ROLES.ADMIN]: [
        'view_dashboard',
        'manage_members',
        'view_statistics',
        'send_announcement',
        'create_channel',
        'manage_channels'
      ],
      [config.ROLES.MODERATOR]: [
        'view_dashboard',
        'manage_members',
        'view_statistics'
      ],
      [config.ROLES.USER]: [
        'view_dashboard'
      ]
    };

    return role && permissions[role] && permissions[role].includes(action);
  }

  // الحصول على وصف الرتبة
  getRoleDescription(role) {
    const descriptions = {
      [config.ROLES.DEVELOPER]: '👨‍💻 مطور النظام',
      [config.ROLES.GROUP_OWNER]: '👑 مالك المجموعة',
      [config.ROLES.ADMIN]: '👨‍💼 مشرف',
      [config.ROLES.MODERATOR]: '👀 مراقب',
      [config.ROLES.USER]: '👤 عضو'
    };
    return descriptions[role] || 'غير محدد';
  }

  // الحصول على قائمة الصلاحيات للرتبة
  getRolePermissions(role) {
    const permissions = {
      [config.ROLES.DEVELOPER]: [
        'الوصول الكامل للنظام',
        'إدارة جميع المجموعات',
        'لوحة تحكم المطور',
        'عرض الإحصائيات الشاملة'
      ],
      [config.ROLES.GROUP_OWNER]: [
        'لوحة تحكم كاملة',
        'إدارة المشرفين',
        'إدارة الأعضاء',
        'إدارة القنوات',
        'عرض الإحصائيات',
        'الإعلانات'
      ],
      [config.ROLES.ADMIN]: [
        'لوحة تحكم المشرف',
        'إدارة الأعضاء',
        'إدارة القنوات',
        'عرض الإحصائيات'
      ],
      [config.ROLES.MODERATOR]: [
        'عرض البيانات',
        'إدارة الأعضاء'
      ],
      [config.ROLES.USER]: [
        'عرض لوحة المعلومات'
      ]
    };
    return permissions[role] || [];
  }
}

module.exports = PermissionManager;
