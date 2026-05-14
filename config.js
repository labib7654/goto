// إعدادات البوت الرئيسية
module.exports = {
  // بيانات البوت
  BOT_TOKEN: '7243808108:AAFxlT-1HQ6twyVewzWqgdEgXd0EK_j4o5Y',
  BOT_NAME: 'قناة إدارة البوت',
  
  // بيانات المطور
  DEVELOPER_ID: 7411444902,
  DEVELOPER_USERNAME: 'developer',
  
  // إعدادات قاعدة البيانات (JSON file-based)
  DB_PATH: './database',
  
  // الرسائل والنصوص
  MESSAGES: {
    START: '🤖 مرحباً بك في بوت إدارة القنوات\n\nاختر من القائمة أدناه:',
    NOT_AUTHORIZED: '❌ عذراً، أنت غير مصرح بالوصول لهذه الميزة',
    DEVELOPER_ONLY: '🔐 هذه الميزة متاحة فقط للمطور',
    ADMIN_ONLY: '👨‍💼 هذه الميزة متاحة فقط للمشرفين',
    GROUP_OWNER_ONLY: '👑 هذه الميزة متاحة فقط لمالك المجموعة',
    SUCCESS: '✅ تم بنجاح',
    ERROR: '❌ حدث خطأ',
  },
  
  // الرتب والصلاحيات
  ROLES: {
    DEVELOPER: 'developer',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    GROUP_OWNER: 'group_owner',
    USER: 'user'
  },
  
  // الألوان للرسائل
  COLORS: {
    SUCCESS: '✅',
    ERROR: '❌',
    INFO: 'ℹ️',
    WARNING: '⚠️'
  }
};
