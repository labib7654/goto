const config = require('./config');

class CallbackHandler {
  constructor(bot, database, permissionManager, commandHandler, developerDashboard, groupOwnerDashboard) {
    this.bot = bot;
    this.db = database;
    this.pm = permissionManager;
    this.commandHandler = commandHandler;
    this.devDashboard = developerDashboard;
    this.groupDashboard = groupOwnerDashboard;
  }

  // معالج الاستدعاءات التفاعلية
  async handleCallback(query) {
    const data = query.data;
    const msg = query.message;
    const userId = query.from.id;

    // رسائل تحميل
    this.bot.answerCallbackQuery(query.id);

    try {
      // القائمة الرئيسية
      if (data === 'back_to_main') {
        this.commandHandler.backToMain(msg);
      }

      // لوحة التحكم الشخصية
      else if (data === 'my_dashboard') {
        this.commandHandler.showMyDashboard(msg);
      }

      // مجموعاتي
      else if (data === 'my_groups') {
        this.commandHandler.showMyGroups(msg);
      }

      // معلومات
      else if (data === 'about') {
        this.commandHandler.showAbout(msg);
      }

      // ===== استدعاءات لوحة التحكم للمطور =====
      else if (data === 'developer_dashboard') {
        this.devDashboard.showDeveloperDashboard(msg);
      }

      else if (data === 'dev_statistics') {
        this.devDashboard.showStatistics(msg);
      }

      else if (data === 'dev_users') {
        this.devDashboard.showUsers(msg);
      }

      else if (data === 'dev_groups') {
        this.devDashboard.showGroups(msg);
      }

      else if (data === 'dev_delete_data') {
        this.devDashboard.deleteAllData(msg);
      }

      else if (data === 'confirm_delete_data') {
        await this.devDashboard.confirmDeleteData(msg);
      }

      // ===== استدعاءات لوحة تحكم صاحب المجموعة =====
      else if (data.startsWith('group_dashboard_')) {
        const groupId = parseInt(data.split('_')[2]);
        this.groupDashboard.showGroupDashboard(msg, groupId);
      }

      else if (data.startsWith('group_members_')) {
        const groupId = parseInt(data.split('_')[2]);
        this.groupDashboard.showMembers(msg, groupId);
      }

      else if (data.startsWith('group_admins_')) {
        const groupId = parseInt(data.split('_')[2]);
        this.groupDashboard.showAdmins(msg, groupId);
      }

      else if (data.startsWith('group_channels_')) {
        const groupId = parseInt(data.split('_')[2]);
        this.groupDashboard.showChannels(msg, groupId);
      }

      else if (data.startsWith('group_statistics_')) {
        const groupId = parseInt(data.split('_')[2]);
        this.groupDashboard.showStatistics(msg, groupId);
      }

      else if (data.startsWith('delete_group_')) {
        const groupId = parseInt(data.split('_')[2]);
        this.groupDashboard.deleteGroup(msg, groupId);
      }

      else if (data.startsWith('confirm_delete_group_')) {
        const groupId = parseInt(data.split('_')[3]);
        await this.groupDashboard.confirmDeleteGroup(msg, groupId);
      }

      // استدعاءات عامة أخرى
      else if (data === 'create_group') {
        this.handleCreateGroup(msg);
      }

      // إذا كانت الاستدعاء غير معروفة
      else {
        this.bot.answerCallbackQuery(query.id, {
          text: 'عملية غير معروفة',
          show_alert: false
        });
      }
    } catch (error) {
      console.error('خطأ في معالج الاستدعاء:', error);
      this.bot.answerCallbackQuery(query.id, {
        text: 'حدث خطأ أثناء معالجة الطلب',
        show_alert: true
      });
    }
  }

  // إنشاء مجموعة جديدة
  handleCreateGroup(msg) {
    const text = `
📝 *إنشاء مجموعة جديدة*

يرجى كتابة اسم المجموعة:
(الحد الأدنى 3 أحرف، الحد الأقصى 50 حرف)
    `;

    const sentMsg = this.bot.sendMessage(msg.chat.id, text);
    
    // حفظ الحالة للمعالجة اللاحقة
    sentMsg.then(response => {
      this.waitingForGroupName = true;
      this.awaitingGroupNameUserId = msg.from.id;
    });
  }

  // معالج النصوص المرسلة
  handleText(msg) {
    const userId = msg.from.id;
    const text = msg.text;

    // إذا كنا في انتظار اسم المجموعة
    if (this.waitingForGroupName && this.awaitingGroupNameUserId === userId) {
      if (text.length < 3 || text.length > 50) {
        return this.bot.sendMessage(
          msg.chat.id,
          '❌ اسم المجموعة يجب أن يكون بين 3 و 50 حرف'
        );
      }

      // إنشاء المجموعة
      const groupId = Math.floor(Math.random() * 1000000);
      this.db.addGroup(groupId, {
        title: text,
        ownerId: userId,
        members: [userId]
      });

      this.waitingForGroupName = false;

      this.bot.sendMessage(
        msg.chat.id,
        `✅ تم إنشاء المجموعة "${text}" بنجاح!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📁 الذهاب إلى المجموعة', callback_data: `group_dashboard_${groupId}` }],
              [{ text: 'العودة', callback_data: 'my_groups' }]
            ]
          }
        }
      );
    }
  }
}

module.exports = CallbackHandler;
