const config = require('./config');

class GroupOwnerDashboard {
  constructor(bot, database, permissionManager) {
    this.bot = bot;
    this.db = database;
    this.pm = permissionManager;
  }

  // عرض لوحة تحكم صاحب المجموعة
  async showGroupDashboard(msg, groupId, userId) {
    const group = this.db.getGroup(groupId);

    // التحقق من أن المستخدم هو صاحب المجموعة
    if (!group || !this.pm.isGroupOwner(userId, groupId)) {
      return this.bot.sendMessage(msg.chat.id, config.MESSAGES.GROUP_OWNER_ONLY);
    }

    const memberCount = group.members.length;
    const adminCount = group.admins.length;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👥 الأعضاء', callback_data: `group_members_${groupId}` },
            { text: '👨‍💼 المشرفون', callback_data: `group_admins_${groupId}` }
          ],
          [
            { text: '📁 القنوات', callback_data: `group_channels_${groupId}` },
            { text: '📊 الإحصائيات', callback_data: `group_statistics_${groupId}` }
          ],
          [
            { text: '🔧 الإعدادات', callback_data: `group_settings_${groupId}` },
            { text: '📢 إعلان', callback_data: `group_announcement_${groupId}` }
          ],
          [
            { text: '🗑️ حذف المجموعة', callback_data: `delete_group_${groupId}` },
            { text: 'العودة', callback_data: 'back_to_main' }
          ]
        ]
      }
    };

    const text = `
👑 *لوحة تحكم مالك المجموعة*

*${group.title}*

📊 الإحصائيات السريعة:
• الأعضاء: ${memberCount}
• المشرفون: ${adminCount}

اختر عملية من القائمة:
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

  // عرض قائمة الأعضاء
  async showMembers(msg, groupId, userId) {
    const group = this.db.getGroup(groupId);
    if (!group) {
      return this.bot.sendMessage(msg.chat.id, '❌ المجموعة غير موجودة');
    }

    const members = group.members.slice(0, 20);
    let text = `👥 *أعضاء المجموعة (${group.members.length} عضو)*\n\n`;

    members.forEach((memberId, index) => {
      const user = this.db.getUser(memberId);
      const isAdmin = group.admins.includes(memberId);
      const badge = isAdmin ? '👨‍💼' : '👤';
      text += `${index + 1}. ${badge} ${user?.firstName || 'مستخدم'} (\`${memberId}\`)\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'العودة', callback_data: `group_dashboard_${groupId}` }]
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

  // عرض قائمة المشرفين
  async showAdmins(msg, groupId, userId) {
    const group = this.db.getGroup(groupId);
    if (!group) {
      return this.bot.sendMessage(msg.chat.id, '❌ المجموعة غير موجودة');
    }

    let text = `👨‍💼 *مشرفو المجموعة (${group.admins.length} مشرف)*\n\n`;

    group.admins.forEach((adminId, index) => {
      const user = this.db.getUser(adminId);
      const isOwner = group.ownerId === adminId ? '👑' : '👨‍💼';
      text += `${index + 1}. ${isOwner} ${user?.firstName || 'مستخدم'} (\`${adminId}\`)\n`;
    });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'إضافة مشرف', callback_data: `add_admin_${groupId}` }],
          [{ text: 'العودة', callback_data: `group_dashboard_${groupId}` }]
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

  // عرض القنوات
  async showChannels(msg, groupId, userId) {
    const channels = this.db.getGroupChannels(groupId);

    let text = `📁 *قنوات المجموعة (${channels.length} قناة)*\n\n`;

    if (channels.length === 0) {
      text += 'لا توجد قنوات حالياً';
    } else {
      channels.forEach((channel, index) => {
        text += `${index + 1}. ${channel.title}\n`;
      });
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ إضافة قناة', callback_data: `create_channel_${groupId}` }],
          [{ text: 'العودة', callback_data: `group_dashboard_${groupId}` }]
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

  // عرض الإحصائيات
  async showStatistics(msg, groupId, userId) {
    const group = this.db.getGroup(groupId);
    const channels = this.db.getGroupChannels(groupId);

    const text = `
📊 *إحصائيات المجموعة*

*${group.title}*

👥 الأعضاء: ${group.members.length}
👨‍💼 المشرفون: ${group.admins.length}
📁 القنوات: ${channels.length}

📅 تاريخ الإنشاء: ${new Date(group.createdAt).toLocaleDateString('ar-EG')}
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'العودة', callback_data: `group_dashboard_${groupId}` }]
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

  // حذف المجموعة
  async deleteGroup(msg, groupId, userId) {
    const group = this.db.getGroup(groupId);

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ إلغاء', callback_data: `group_dashboard_${groupId}` },
            { text: '✅ تأكيد الحذف', callback_data: `confirm_delete_group_${groupId}` }
          ]
        ]
      }
    };

    const text = `
⚠️ *تحذير: حذف المجموعة*

هل أنت متأكد من حذف المجموعة: *${group.title}*؟
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

  // تأكيد حذف المجموعة
  async confirmDeleteGroup(msg, groupId, userId) {
    try {
      this.db.updateGroup(groupId, { deleted: true, deletedAt: new Date().toISOString() });

      this.bot.editMessageText(
        '✅ تم حذف المجموعة بنجاح',
        {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'العودة', callback_data: 'back_to_main' }]
            ]
          }
        }
      );
    } catch (error) {
      this.bot.sendMessage(msg.chat.id, '❌ حدث خطأ أثناء حذف المجموعة');
    }
  }
}

module.exports = GroupOwnerDashboard;