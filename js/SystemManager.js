import { AccountManager } from './AccountManager.js';
import { TransactionManager } from './TransactionManager.js';
import { AuthManager } from './AuthManager.js';
import { FraudDetector } from './FraudDetector.js';
import { ReportGenerator } from './ReportGenerator.js';
import { ACCOUNT_TYPES } from './Constants.js';

export class SystemManager {
  constructor() {
    this.accountManager = new AccountManager();
    this.transactionManager = new TransactionManager();
    this.authManager = new AuthManager();
    this.fraudDetector = new FraudDetector();
    this.reportGenerator = new ReportGenerator(this.accountManager, this.transactionManager);
  }

  // User Management (via AuthManager)
  createUser(username, password, role = 'user') {
    return this.authManager.createUser(username, password, role);
  }

  login(username, password) {
    return this.authManager.login(username, password);
  }

  logout(sessionId) {
    return this.authManager.logout(sessionId);
  }

  getUserInfo(sessionId) {
    return this.authManager.getUserInfo(sessionId);
  }

  changePassword(sessionId, oldPassword, newPassword) {
    return this.authManager.changePassword(sessionId, oldPassword, newPassword);
  }

  // Account Management (via AccountManager)
  createAccount(sessionId, accountHolderName, initialDeposit, accountType = ACCOUNT_TYPES.CHECKING) {
    if (!this.authManager.validateSession(sessionId)) {
      throw new Error('جلسة غير صالحة');
    }
    const account = this.accountManager.createAccount(accountHolderName, initialDeposit, accountType);
    this.authManager.linkAccountToUser(this.authManager.validateSession(sessionId).userId, account.accountNumber);
    return account;
  }

  getAccount(accountNumber) {
    return this.accountManager.getAccount(accountNumber);
  }

  deposit(sessionId, accountNumber, amount) {
    if (!this.authManager.validateSession(sessionId)) {
      throw new Error('جلسة غير صالحة');
    }
    if (!this.authManager.userOwnsAccount(sessionId, accountNumber)) {
      throw new Error('ليس لديك صلاحية الوصول لهذا الحساب');
    }
    const account = this.accountManager.getAccount(accountNumber);
    const transaction = account.deposit(amount);
    this.transactionManager.addTransaction(transaction);
    this.fraudDetector.detectFraud(transaction); // Check for fraud
    return transaction;
  }

  withdraw(sessionId, accountNumber, amount) {
    if (!this.authManager.validateSession(sessionId)) {
      throw new Error('جلسة غير صالحة');
    }
    if (!this.authManager.userOwnsAccount(sessionId, accountNumber)) {
      throw new Error('ليس لديك صلاحية الوصول لهذا الحساب');
    }
    const account = this.accountManager.getAccount(accountNumber);
    try {
      const transaction = account.withdraw(amount);
      this.transactionManager.addTransaction(transaction);
      this.fraudDetector.detectFraud(transaction); // Check for fraud
      return transaction;
    } catch (error) {
      // If a fee was applied, the transaction for the fee is already added in Account.js
      // We just need to ensure it's also added to the central transaction manager if not already.
      // This might require a more robust way to get the fee transaction from Account.js
      // For now, we assume Account.js handles adding its own transactions.
      throw error;
    }
  }

  transfer(sessionId, fromAccountNumber, toAccountNumber, amount) {
    if (!this.authManager.validateSession(sessionId)) {
      throw new Error('جلسة غير صالحة');
    }
    if (!this.authManager.userOwnsAccount(sessionId, fromAccountNumber)) {
      throw new Error('ليس لديك صلاحية الوصول لهذا الحساب');
    }
    // No need to check toAccountNumber ownership for transfer, as it's a destination

    const { fromTransaction, toTransaction } = this.accountManager.transfer(fromAccountNumber, toAccountNumber, amount);
    this.transactionManager.addTransaction(fromTransaction);
    this.transactionManager.addTransaction(toTransaction);
    this.fraudDetector.detectFraud(fromTransaction); // Check for fraud on the outgoing transaction
    return { fromTransaction, toTransaction };
  }

  applyMonthlyInterest(accountNumber) {
    const account = this.accountManager.getAccount(accountNumber);
    if (account.accountType !== ACCOUNT_TYPES.SAVINGS) {
      throw new Error('الفائدة تطبق فقط على حسابات التوفير');
    }
    const interestTransaction = account.applyMonthlyInterest();
    if (interestTransaction) {
      this.transactionManager.addTransaction(interestTransaction);
    }
    return interestTransaction;
  }

  // Admin Functions (require admin approval)
  freezeAccount(sessionId, accountNumber) {
    if (!this.authManager.isAdmin(sessionId)) {
      throw new Error('يتطلب صلاحيات المدير لتجميد الحساب');
    }
    return this.accountManager.freezeAccount(accountNumber, true);
  }

  unfreezeAccount(sessionId, accountNumber) {
    if (!this.authManager.isAdmin(sessionId)) {
      throw new Error('يتطلب صلاحيات المدير لفك تجميد الحساب');
    }
    return this.accountManager.unfreezeAccount(accountNumber, true);
  }

  deleteAccount(sessionId, accountNumber) {
    if (!this.authManager.isAdmin(sessionId)) {
      throw new Error('يتطلب صلاحيات المدير لحذف الحساب');
    }
    return this.accountManager.deleteAccount(accountNumber, true);
  }

  // Reporting (via ReportGenerator)
  generateAccountSummary(accountNumber) {
    return this.reportGenerator.generateAccountSummary(accountNumber);
  }

  generateAllAccountsOverview() {
    return this.reportGenerator.generateAllAccountsOverview();
  }

  generateTransactionReport(criteria) {
    return this.reportGenerator.generateTransactionReport(criteria);
  }

  getSuspiciousActivities() {
    return this.fraudDetector.getSuspiciousActivities();
  }

  clearSuspiciousActivities() {
    this.fraudDetector.clearSuspiciousActivities();
  }

  // Getters for managers (for direct access if needed, but prefer SystemManager methods)
  getAccountManager() {
    return this.accountManager;
  }

  getTransactionManager() {
    return this.transactionManager;
  }

  getAuthManager() {
    return this.authManager;
  }

  getFraudDetector() {
    return this.fraudDetector;
  }

  getReportGenerator() {
    return this.reportGenerator;
  }
}

