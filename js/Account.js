import { generateAccountNumber, isValidAmount, getCurrentTimestamp } from './Helpers.js';
import { TRANSACTION_TYPES, FEES, DAILY_WITHDRAWAL_LIMIT, ACCOUNT_TYPES } from './Constants.js';
import { Transaction } from './Transaction.js';

export class Account {
  constructor(accountHolderName, initialDeposit, accountType = ACCOUNT_TYPES.CHECKING) {
    if (!accountHolderName || !isValidAmount(initialDeposit)) {
      throw new Error('اسم صاحب الحساب والإيداع الأولي مطلوبان');
    }

    this.accountNumber = generateAccountNumber();
    this.accountHolderName = accountHolderName;
    this.balance = initialDeposit;
    this.accountType = accountType;
    this.transactions = [];
    this.isFrozen = false;
    this.dailyWithdrawals = new Map(); // تتبع السحوبات اليومية
    this.createdAt = getCurrentTimestamp();

    // تسجيل الإيداع الأولي
    this.addTransaction(new Transaction(TRANSACTION_TYPES.DEPOSIT, initialDeposit, this.accountNumber, 'الإيداع الأولي'));
  }

  addTransaction(transaction) {
    this.transactions.push(transaction);
  }

  deposit(amount) {
    if (this.isFrozen) {
      throw new Error('الحساب مجمد، لا يمكن إجراء معاملات');
    }

    if (!isValidAmount(amount)) {
      throw new Error('مبلغ الإيداع يجب أن يكون موجباً');
    }

    this.balance += amount;
    const transaction = new Transaction(TRANSACTION_TYPES.DEPOSIT, amount, this.accountNumber, 'إيداع');
    this.addTransaction(transaction);
    return transaction;
  }

  withdraw(amount) {
    if (this.isFrozen) {
      throw new Error('الحساب مجمد، لا يمكن إجراء معاملات');
    }

    if (!isValidAmount(amount)) {
      throw new Error('مبلغ السحب يجب أن يكون موجباً');
    }

    // التحقق من السقف اليومي
    const today = new Date().toDateString();
    const todayWithdrawals = this.dailyWithdrawals.get(today) || 0;
    
    if (todayWithdrawals + amount > DAILY_WITHDRAWAL_LIMIT) {
      throw new Error(`تجاوز السقف اليومي للسحب ($${DAILY_WITHDRAWAL_LIMIT})`);
    }

    if (this.balance < amount) {
      // تطبيق غرامة عدم كفاية الرصيد
      this.balance -= FEES.INSUFFICIENT_FUNDS;
      const feeTransaction = new Transaction(TRANSACTION_TYPES.WITHDRAWAL, FEES.INSUFFICIENT_FUNDS, this.accountNumber, 'غرامة عدم كفاية الرصيد');
      this.addTransaction(feeTransaction);
      throw new Error('الرصيد غير كافٍ، تم تطبيق غرامة $5');
    }

    this.balance -= amount;
    this.dailyWithdrawals.set(today, todayWithdrawals + amount);
    
    const transaction = new Transaction(TRANSACTION_TYPES.WITHDRAWAL, amount, this.accountNumber, 'سحب');
    this.addTransaction(transaction);
    return transaction;
  }

  freeze() {
    this.isFrozen = true;
  }

  unfreeze() {
    this.isFrozen = false;
  }

  getBalance() {
    return this.balance;
  }

  getTransactions() {
    return [...this.transactions]; // إرجاع نسخة للحماية
  }

  getAccountInfo() {
    return {
      accountNumber: this.accountNumber,
      accountHolderName: this.accountHolderName,
      balance: this.balance,
      accountType: this.accountType,
      isFrozen: this.isFrozen,
      createdAt: this.createdAt
    };
  }
}

