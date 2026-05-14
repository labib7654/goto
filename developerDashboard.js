const config = require('./config');

class DeveloperDashboard {
  constructor(bot, database, permissionManager) {
    this.bot = bot;
    this.db = database;
    this.pm = permissionManager;
  }

  // عرض لوحة تحكم المطور
  async showDeveloperDashboard(msg, userId) {

    // التحقق من أن المستخدم هو المطور
    if (!this.pm.isDeveloper(userId)) {
      return this.bot.sendMessage(msg.chat.id, config.MESSAGES.DEVELOPER_ONLY);
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 الإحصائيات', callback_data: 'dev_statistics' },
            { text: '👥 المستخدمون', callback_data: 'dev_users' }
          ],
          [
            { text: '📁 المجموعات', callback_data: 'dev_groups' },
            { text: '🔧 الإعدادات', callback_data: 'dev_settings' }
          ],
          [
            { text: '🗑️ حذف بيانات', callback_data: 'dev_delete_data' },
            { text: '🔐 إدارة الأدوار', callback_data: 'dev_manage_roles' }
          ],
          [
            { text: 'العودة', callback_data: 'back_to_main' }
          ]
        ]
      }
    };

    const text = `
🔐 *لوحة تحكم المطور*

مرحباً بك في لوحة التحكم الشاملة

اختر عملية من القائمة أدناه:
    `;

    this.bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      ...keyboard
    }).catch(() => {
      this.bot.sendMessage(msg.chat.id, text, keyboard);
    });
  }

  // عرض الإحصائيات
  async showStatistics(msg, userId) {
    const users = this.db.getAllUsers();
    const groups = this.db.getAllGroups();

    const userCount = Object.keys(users).length;
    const groupCount = Object.keys(groups).length;
    const developerCount = Object.values(users).filter(u => u.role === config.ROLES.DEVELOPER).length;
    const adminCount = Object.values(users).filter(u => u.role === config.ROLES.ADMIN).length;

    const text = `
📊 *الإحصائيات الشاملة*

👥 *إجمالي المستخدمين:* ${userCount}
📁 *إجمالي المجموعات:* ${groupCount}
👨‍💼 *عدد المشرفين:* ${adminCount}
👨‍💻 *عدد المطورين:* ${developerCount}

_آخر تحديث: ${new Date().toLocaleString('ar-EG')}_
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 تحديث', callback_data: 'dev_statistics' }],
          [{ text: 'العودة', callback_data: 'developer_dashboard' }]
        ]
      }
    };

    this.bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      ...keyboard
    }).catch(() => {
      this.bot.sendMessage(msg.chat.id, text, keyboard);
    });
  }

  // عرض قائمة المستخدمين
  async showUsers(msg, userId) {
    const users = this.db.getAllUsers();
    const userList = Object.values(users).slice(0, 10);

    let text = '👥 *قائمة المستخدمين (أول 10)*\n\n';
    userList.forEach((user, index) => {
      text += `${index + 1}. ${user.firstName || user.username} \`${user.id}\`\n`;
      text += `   الرتبة: ${this.pm.getRoleDescription(user.role)}\n\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'العودة', callback_data: 'developer_dashboard' }]
        ]
      }
    };

    this.bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      ...keyboard
    }).catch(() => {
      this.bot.sendMessage(msg.chat.id, text, keyboard);
    });
  }

  // عرض قائمة المجموعات
  async showGroups(msg, userId) {
    const groups = this.db.getAllGroups();
    const groupList = Object.values(groups).slice(0, 10);

    let text = '📁 *قائمة المجموعات (أول 10)*\n\n';
    groupList.forEach((group, index) => {
      text += `${index + 1}. ${group.title}\n`;
      text += `   المالك: \`${group.ownerId}\`\n`;
      text += `   الأعضاء: ${group.members.length}\n`;
      text += `   المشرفون: ${group.admins.length}\n\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'العودة', callback_data: 'developer_dashboard' }]
        ]
      }
    };

    this.bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      ...keyboard
    }).catch(() => {
      this.bot.sendMessage(msg.chat.id, text, keyboard);
    });
  }

  // حذف جميع البيانات
  async deleteAllData(msg, userId) {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ إلغاء', callback_data: 'developer_dashboard' },
            { text: '✅ تأكيد الحذف', callback_data: 'confirm_delete_data' }
          ]
        ]
      }
    };

    const text = `
⚠️ *تحذير: حذف البيانات*

هل أنت متأكد من حذف جميع البيانات؟
هذا الإجراء لا يمكن التراجع عنه!
    `;

    this.bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: 'Markdown',
      ...keyboard
    }).catch(() => {
      this.bot.sendMessage(msg.chat.id, text, keyboard);
    });
  }

  // تأكيد حذف البيانات
  async confirmDeleteData(msg, userId) {
    // حذف الملفات
    const fs = require('fs');
    const path = require('path');
    const dbPath = './database';

    try {
      const files = ['users.json', 'groups.json', 'channels.json'];
      files.forEach(file => {
        const filePath = path.join(dbPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      this.bot.editMessageText(
        '✅ تم حذف جميع البيانات بنجاح',
        {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'العودة', callback_data: 'developer_dashboard' }]
            ]
          }
        }
      );
    } catch (error) {
      this.bot.editMessageText(
        '❌ حدث خطأ أثناء حذف البيانات',
        {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'العودة', callback_data: 'developer_dashboard' }]
            ]
          }
        }
      );
    }
  }
}

module.exports = DeveloperDashboard;