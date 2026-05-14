const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const Database = require('./database');
const PermissionManager = require('./permissionManager');
const DeveloperDashboard = require('./developerDashboard');
const GroupOwnerDashboard = require('./groupOwnerDashboard');
const CommandHandler = require('./commandHandler');
const CallbackHandler = require('./callbackHandler');

// تهيئة البوت
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const database = new Database();
const permissionManager = new PermissionManager(database);
const developerDashboard = new DeveloperDashboard(bot, database, permissionManager);
const groupOwnerDashboard = new GroupOwnerDashboard(bot, database, permissionManager);
const commandHandler = new CommandHandler(
  bot,
  database,
  permissionManager,
  developerDashboard,
  groupOwnerDashboard
);
const callbackHandler = new CallbackHandler(
  bot,
  database,
  permissionManager,
  commandHandler,
  developerDashboard,
  groupOwnerDashboard
);

// ===== معالجات الأوامر الأساسية =====

// أمر /start
bot.onText(/\/start/, (msg) => {
  commandHandler.handleStart(msg);
});

// أمر /help
bot.onText(/\/help/, (msg) => {
  const helpText = `
📚 *مساعدة البوت*

*الأوامر المتاحة:*
/start - بدء البوت
/help - عرض المساعدة
/mygroups - عرض مجموعاتي
/dashboard - لوحة تحكمي

*الميزات الرئيسية:*
✓ إدارة كاملة للمجموعات
✓ نظام متقدم للصلاحيات
✓ لوحة تحكم للمطور
✓ لوحة تحكم لمالك المجموعة
✓ إدارة الأعضاء والمشرفين

للمزيد، استخدم القوائم التفاعلية 👇
  `;

  bot.sendMessage(msg.chat.id, helpText, {
    parse_mode: 'Markdown'
  });
});

// أمر /mygroups
bot.onText(/\/mygroups/, (msg) => {
  commandHandler.showMyGroups(msg);
});

// أمر /dashboard
bot.onText(/\/dashboard/, (msg) => {
  commandHandler.showMyDashboard(msg);
});

// معالج الرسائل العادية
bot.on('message', (msg) => {
  // إذا كانت رسالة من مجموعة
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    commandHandler.handleGroupMessage(msg);
  }
  
  // معالجة الرسائل المنتظرة (مثل إنشاء مجموعة)
  if (msg.text && !msg.text.startsWith('/')) {
    callbackHandler.handleText(msg);
  }
});

// معالج الاستدعاءات التفاعلية
bot.on('callback_query', (query) => {
  callbackHandler.handleCallback(query);
});

// معالج انضمام المستخدم للمجموعة
bot.on('new_chat_members', (msg) => {
  const groupId = msg.chat.id;
  let group = database.getGroup(groupId);

  if (!group) {
    group = database.addGroup(groupId, {
      title: msg.chat.title,
      ownerId: msg.from.id,
      members: []
    });
  }

  msg.new_chat_members.forEach(member => {
    if (!member.is_bot) {
      database.addGroupMember(groupId, member.id);
      database.addUser(member.id, {
        username: member.username || '',
        firstName: member.first_name || '',
        lastName: member.last_name || ''
      });
    }
  });
});

// معالج مغادرة المستخدم للمجموعة
bot.on('left_chat_member', (msg) => {
  const groupId = msg.chat.id;
  const userId = msg.left_chat_member.id;

  database.removeGroupMember(groupId, userId);
});

// معالج تحديث بيانات المجموعة
bot.on('group_chat_created', (msg) => {
  const groupId = msg.chat.id;
  const userId = msg.from.id;

  database.addGroup(groupId, {
    title: msg.chat.title,
    ownerId: userId,
    members: [userId]
  });

  database.addUser(userId, {
    username: msg.from.username || '',
    firstName: msg.from.first_name || '',
    lastName: msg.from.last_name || ''
  });
});

// ===== معالجة الأخطاء =====

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// بدء البوت
console.log('🤖 البوت قيد التشغيل...');
console.log(`✅ معرّف البوت: ${config.DEVELOPER_ID}`);
console.log(`📊 قاعدة البيانات: ${config.DB_PATH}`);

// حفظ معلومات البوت
bot.getMe().then(botInfo => {
  console.log(`🎯 اسم البوت: @${botInfo.username}`);
  console.log('✨ البوت جاهز للاستقبال');
});

module.exports = bot;
