const fs = require('fs');
const path = require('path');

class Database {
  constructor(dbPath = './database') {
    this.dbPath = dbPath;
    this.usersFile = path.join(dbPath, 'users.json');
    this.groupsFile = path.join(dbPath, 'groups.json');
    this.channelsFile = path.join(dbPath, 'channels.json');
    
    this.initDatabase();
  }

  // تهيئة قاعدة البيانات
  initDatabase() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(this.groupsFile)) {
      fs.writeFileSync(this.groupsFile, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(this.channelsFile)) {
      fs.writeFileSync(this.channelsFile, JSON.stringify({}, null, 2));
    }
  }

  // ===== المستخدمون =====
  
  // إضافة أو تحديث مستخدم
  addUser(userId, userData) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    users[userId] = {
      id: userId,
      username: userData.username || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'user',
      createdAt: users[userId]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData
    };
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
    return users[userId];
  }

  // الحصول على بيانات المستخدم
  getUser(userId) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    return users[userId] || null;
  }

  // تحديث رتبة المستخدم
  updateUserRole(userId, role) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    if (users[userId]) {
      users[userId].role = role;
      users[userId].updatedAt = new Date().toISOString();
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      return true;
    }
    return false;
  }

  // حذف مستخدم
  deleteUser(userId) {
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    delete users[userId];
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
  }

  // الحصول على جميع المستخدمين
  getAllUsers() {
    return JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
  }

  // ===== المجموعات =====

  // إضافة مجموعة
  addGroup(groupId, groupData) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    groups[groupId] = {
      id: groupId,
      title: groupData.title || '',
      ownerId: groupData.ownerId,
      members: groupData.members || [],
      admins: groupData.admins || [groupData.ownerId],
      moderators: groupData.moderators || [],
      createdAt: groups[groupId]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: groupData.settings || {}
    };
    fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
    return groups[groupId];
  }

  // الحصول على مجموعة
  getGroup(groupId) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    return groups[groupId] || null;
  }

  // تحديث بيانات المجموعة
  updateGroup(groupId, updates) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    if (groups[groupId]) {
      groups[groupId] = { ...groups[groupId], ...updates, updatedAt: new Date().toISOString() };
      fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
      return groups[groupId];
    }
    return null;
  }

  // إضافة عضو للمجموعة
  addGroupMember(groupId, userId) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    if (groups[groupId] && !groups[groupId].members.includes(userId)) {
      groups[groupId].members.push(userId);
      fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
    }
  }

  // حذف عضو من المجموعة
  removeGroupMember(groupId, userId) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    if (groups[groupId]) {
      groups[groupId].members = groups[groupId].members.filter(id => id !== userId);
      fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
    }
  }

  // جعل مستخدم مشرف
  makeGroupAdmin(groupId, userId) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    if (groups[groupId] && !groups[groupId].admins.includes(userId)) {
      groups[groupId].admins.push(userId);
      fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
    }
  }

  // إزالة صلاحيات المشرف
  removeGroupAdmin(groupId, userId) {
    const groups = JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
    if (groups[groupId]) {
      groups[groupId].admins = groups[groupId].admins.filter(id => id !== userId);
      fs.writeFileSync(this.groupsFile, JSON.stringify(groups, null, 2));
    }
  }

  // الحصول على جميع المجموعات
  getAllGroups() {
    return JSON.parse(fs.readFileSync(this.groupsFile, 'utf8'));
  }

  // ===== القنوات =====

  // إضافة قناة
  addChannel(channelId, channelData) {
    const channels = JSON.parse(fs.readFileSync(this.channelsFile, 'utf8'));
    channels[channelId] = {
      id: channelId,
      title: channelData.title || '',
      groupId: channelData.groupId,
      createdAt: channels[channelId]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...channelData
    };
    fs.writeFileSync(this.channelsFile, JSON.stringify(channels, null, 2));
    return channels[channelId];
  }

  // الحصول على قناة
  getChannel(channelId) {
    const channels = JSON.parse(fs.readFileSync(this.channelsFile, 'utf8'));
    return channels[channelId] || null;
  }

  // حذف قناة
  deleteChannel(channelId) {
    const channels = JSON.parse(fs.readFileSync(this.channelsFile, 'utf8'));
    delete channels[channelId];
    fs.writeFileSync(this.channelsFile, JSON.stringify(channels, null, 2));
  }

  // الحصول على قنوات المجموعة
  getGroupChannels(groupId) {
    const channels = JSON.parse(fs.readFileSync(this.channelsFile, 'utf8'));
    return Object.values(channels).filter(ch => ch.groupId === groupId);
  }
}

module.exports = Database;
