const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const Database = require('./database');
const PermissionManager = require('./permissionManager');
const DeveloperDashboard = require('./developerDashboard');
const GroupOwnerDashboard = require('./groupOwnerDashboard');
const CommandHandler = require('./commandHandler');
const CallbackHandler = require('./callbackHandler');

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

// أمر /start (تم تعديله)
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  commandHandler.handleStart(userId, chatId, firstName);
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
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

// أمر /mygroups
bot.onText(/\/mygroups/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  commandHandler.showMyGroups(userId, chatId, messageId);
});

// أمر /dashboard
bot.onText(/\/dashboard/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  commandHandler.showMyDashboard(userId, chatId, messageId);
});

// معالج الرسائل العادية
bot.on('message', (msg) => {
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    commandHandler.handleGroupMessage(msg);
  }
  if (msg.text && !msg.text.startsWith('/')) {
    callbackHandler.handleText(msg);
  }
});

// معالج الاستدعاءات
bot.on('callback_query', (query) => {
  callbackHandler.handleCallback(query);
});

// معالج انضمام المستخدم
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

// معالج مغادرة المستخدم
bot.on('left_chat_member', (msg) => {
  database.removeGroupMember(msg.chat.id, msg.left_chat_member.id);
});

// معالج إنشاء مجموعة جديدة
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

bot.on('polling_error', (error) => console.error('Polling error:', error.code));
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('🤖 البوت قيد التشغيل...');
console.log(`✅ معرّف المطور: ${config.DEVELOPER_ID}`);
bot.getMe().then(botInfo => console.log(`🎯 اسم البوت: @${botInfo.username}`));