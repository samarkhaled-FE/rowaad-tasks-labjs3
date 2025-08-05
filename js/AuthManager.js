import { PasswordValidator } from './PasswordValidator.js';

export class AuthManager {
  constructor() {
    this.users = new Map(); // userId -> { username, passwordHash, role, accountNumbers }
    this.sessions = new Map(); // sessionId -> { userId, loginTime, lastActivity }
    this.adminUsers = new Set(); // Set of admin user IDs
  }

  // تشفير كلمة المرور (بسيط للمثال - في الواقع يجب استخدام bcrypt أو مشابه)
  hashPassword(password) {
    // هذا مثال بسيط - في التطبيق الحقيقي يجب استخدام مكتبة تشفير قوية
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // إنشاء مستخدم جديد
  createUser(username, password, role = 'user') {
    // التحقق من قوة كلمة المرور
    const validation = PasswordValidator.validate(password);
    if (!validation.isValid) {
      throw new Error(`كلمة المرور غير صالحة: ${validation.errors.join(' ')}`);
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    for (const user of this.users.values()) {
      if (user.username === username) {
        throw new Error('اسم المستخدم موجود مسبقاً');
      }
    }

    const userId = this.generateUserId();
    const passwordHash = this.hashPassword(password);

    const user = {
      userId,
      username,
      passwordHash,
      role,
      accountNumbers: [],
      createdAt: new Date(),
      lastLogin: null
    };

    this.users.set(userId, user);

    if (role === 'admin') {
      this.adminUsers.add(userId);
    }

    return userId;
  }

  // تسجيل الدخول
  login(username, password) {
    const user = this.findUserByUsername(username);
    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // إنشاء جلسة
    const sessionId = this.generateSessionId();
    const session = {
      userId: user.userId,
      loginTime: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    user.lastLogin = new Date();

    return sessionId;
  }

  // تسجيل الخروج
  logout(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  // التحقق من صحة الجلسة
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // تحديث آخر نشاط
    session.lastActivity = new Date();
    return session;
  }

  // التحقق من صلاحيات المدير
  isAdmin(sessionId) {
    const session = this.validateSession(sessionId);
    if (!session) {
      return false;
    }

    return this.adminUsers.has(session.userId);
  }

  // ربط حساب مصرفي بمستخدم
  linkAccountToUser(userId, accountNumber) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (!user.accountNumbers.includes(accountNumber)) {
      user.accountNumbers.push(accountNumber);
    }
  }

  // التحقق من ملكية الحساب
  userOwnsAccount(sessionId, accountNumber) {
    const session = this.validateSession(sessionId);
    if (!session) {
      return false;
    }

    const user = this.users.get(session.userId);
    return user && user.accountNumbers.includes(accountNumber);
  }

  // تغيير كلمة المرور
  changePassword(sessionId, oldPassword, newPassword) {
    const session = this.validateSession(sessionId);
    if (!session) {
      throw new Error('جلسة غير صالحة');
    }

    const user = this.users.get(session.userId);
    const oldPasswordHash = this.hashPassword(oldPassword);

    if (user.passwordHash !== oldPasswordHash) {
      throw new Error('كلمة المرور القديمة غير صحيحة');
    }

    // التحقق من قوة كلمة المرور الجديدة
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.isValid) {
      throw new Error(`كلمة المرور الجديدة غير صالحة: ${validation.errors.join(' ')}`);
    }

    user.passwordHash = this.hashPassword(newPassword);
    return true;
  }

  // دوال مساعدة
  generateUserId() {
    return 'USER' + Date.now() + Math.floor(Math.random() * 1000);
  }

  generateSessionId() {
    return 'SESSION' + Date.now() + Math.floor(Math.random() * 10000);
  }

  findUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  getUserInfo(sessionId) {
    const session = this.validateSession(sessionId);
    if (!session) {
      return null;
    }

    const user = this.users.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      username: user.username,
      role: user.role,
      accountNumbers: [...user.accountNumbers],
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  }

  // إحصائيات المستخدمين
  getUserStats() {
    return {
      totalUsers: this.users.size,
      adminUsers: this.adminUsers.size,
      activeSessions: this.sessions.size
    };
  }
}

