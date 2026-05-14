const config = require('./config');

class CommandHandler {
  constructor(bot, database, permissionManager, developerDashboard, groupOwnerDashboard) {
    this.bot = bot;
    this.db = database;
    this.pm = permissionManager;
    this.devDashboard = developerDashboard;
    this.groupDashboard = groupOwnerDashboard;
  }

  // معالج الرسالة الافتتاحية
  handleStart(msg) {
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'صديق';

    // إضافة/تحديث المستخدم
    this.db.addUser(userId, {
      username: msg.from.username || '',
      firstName: firstName,
      lastName: msg.from.last_name || '',
      role: config.ROLES.USER
    });

    const mainKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👑 لوحة تحكمي', callback_data: 'my_dashboard' }],
          [{ text: '📁 مجموعاتي', callback_data: 'my_groups' }],
          [{ text: 'ℹ️ معلومات', callback_data: 'about' }]
        ]
      }
    };

    // إذا كان المطور، أضف خيار لوحة تحكم المطور
    if (this.pm.isDeveloper(userId)) {
      mainKeyboard.reply_markup.inline_keyboard.push(
        [{ text: '🔐 لوحة التحكم (مطور)', callback_data: 'developer_dashboard' }]
      );
    }

    const text = `
🤖 *مرحباً بك يا ${firstName}!*

مرحباً بك في بوت إدارة القنوات والمجموعات 🎉

اختر ما تريد من القائمة أدناه:
    `;

    this.bot.sendMessage(msg.chat.id, text, mainKeyboard);
  }

  // معالج استقبال رسالة من مجموعة
  handleGroupMessage(msg) {
    const groupId = msg.chat.id;
    const userId = msg.from.id;

    // إضافة المستخدم إلى المجموعة إذا لم يكن موجوداً
    let group = this.db.getGroup(groupId);
    if (!group) {
      group = this.db.addGroup(groupId, {
        title: msg.chat.title,
        ownerId: userId,
        members: [userId]
      });
    } else if (!group.members.includes(userId)) {
      this.db.addGroupMember(groupId, userId);
    }

    // إضافة المستخدم إلى قاعدة البيانات إذا لم يكن موجوداً
    if (!this.db.getUser(userId)) {
      this.db.addUser(userId, {
        username: msg.from.username || '',
        firstName: msg.from.first_name || '',
        lastName: msg.from.last_name || ''
      });
    }
  }

  // عرض لوحة التحكم الشخصية
  showMyDashboard(msg, userId) {
    const user = this.db.getUser(userId);

    let text = `
👤 *لوحة التحكم الشخصية*

*الاسم:* ${user?.firstName} ${user?.lastName || ''}
*المعرّف:* \`${userId}\`
*الرتبة:* ${this.pm.getRoleDescription(user?.role)}

الصلاحيات:
    `;

    const permissions = this.pm.getRolePermissions(user?.role || config.ROLES.USER);
    permissions.forEach(perm => {
      text += `✓ ${perm}\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📁 مجموعاتي', callback_data: 'my_groups' },
            { text: '🔄 تحديث', callback_data: 'my_dashboard' }
          ],
          [{ text: 'العودة', callback_data: 'back_to_main' }]
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

  // عرض مجموعات المستخدم
  showMyGroups(msg, userId) {
    const allGroups = this.db.getAllGroups();
    const userGroups = Object.values(allGroups).filter(
      g => g.members.includes(userId) && !g.deleted
    );

    let text = `📁 *مجموعاتي (${userGroups.length})*\n\n`;

    if (userGroups.length === 0) {
      text += 'أنت لا تملك أي مجموعات حالياً';
    } else {
      userGroups.forEach((group, index) => {
        const roleEmoji = this.pm.isGroupOwner(userId, group.id) ? '👑' : '👤';
        text += `${index + 1}. ${roleEmoji} *${group.title}*\n`;
        text += `   الأعضاء: ${group.members.length}\n`;
        text += `   رتبتك: ${this.pm.getUserGroupRole(userId, group.id)}\n\n`;
      });
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ إنشاء مجموعة', callback_data: 'create_group' }],
          [{ text: 'العودة', callback_data: 'back_to_main' }]
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

  // عرض معلومات عن البوت
  showAbout(msg) {
    const text = `
ℹ️ *معلومات عن البوت*

🤖 *بوت إدارة القنوات والمجموعات*

هذا البوت يوفر:
✓ إدارة كاملة للمجموعات
✓ نظام متقدم للصلاحيات
✓ لوحة تحكم للمطور
✓ لوحة تحكم لمالك المجموعة
✓ إدارة الأعضاء والمشرفين
✓ نظام الإعلانات

*الإصدار:* 1.0.0
*اللغة:* العربية

للمزيد من المساعدة، استخدم /help
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'العودة', callback_data: 'back_to_main' }]
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

  // العودة للقائمة الرئيسية
  backToMain(msg, userId) {
    // نبني msg وهمي يحتوي on.id الصحيح لدالة handleStart
    const fakeMsg = { ...msg, from: { ...msg.from, id: userId } };
    this.handleStart(fakeMsg);
  }
}

module.exports = CommandHandler;