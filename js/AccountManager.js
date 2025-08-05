import { Account } from './Account.js';
import { SavingsAccount } from './SavingsAccount.js';
import { ACCOUNT_TYPES, TRANSACTION_TYPES } from './Constants.js';
import { Transaction } from './Transaction.js';
import { isValidAmount } from './Helpers.js';

export class AccountManager {
  constructor() {
    this.accounts = new Map();
  }

  createAccount(accountHolderName, initialDeposit, accountType = ACCOUNT_TYPES.CHECKING) {
    let account;
    
    if (accountType === ACCOUNT_TYPES.SAVINGS) {
      account = new SavingsAccount(accountHolderName, initialDeposit);
    } else {
      account = new Account(accountHolderName, initialDeposit, accountType);
    }

    this.accounts.set(account.accountNumber, account);
    return account;
  }

  getAccount(accountNumber) {
    const account = this.accounts.get(accountNumber);
    if (!account) {
      throw new Error('الحساب غير موجود');
    }
    return account;
  }

  transfer(fromAccountNumber, toAccountNumber, amount) {
    if (!isValidAmount(amount)) {
      throw new Error('مبلغ التحويل يجب أن يكون موجباً');
    }

    const fromAccount = this.getAccount(fromAccountNumber);
    const toAccount = this.getAccount(toAccountNumber);

    if (fromAccount.isFrozen || toAccount.isFrozen) {
      throw new Error('أحد الحسابات مجمد، لا يمكن إجراء التحويل');
    }

    if (fromAccount.balance < amount) {
      throw new Error('الرصيد غير كافٍ للتحويل');
    }

    // خصم من الحساب المرسل
    fromAccount.balance -= amount;
    const withdrawalTransaction = new Transaction(
      TRANSACTION_TYPES.TRANSFER, 
      amount, 
      fromAccountNumber, 
      `تحويل إلى ${toAccountNumber}`,
      toAccountNumber
    );
    fromAccount.addTransaction(withdrawalTransaction);

    // إضافة للحساب المستقبل
    toAccount.balance += amount;
    const depositTransaction = new Transaction(
      TRANSACTION_TYPES.TRANSFER, 
      amount, 
      toAccountNumber, 
      `تحويل من ${fromAccountNumber}`,
      fromAccountNumber
    );
    toAccount.addTransaction(depositTransaction);

    return {
      fromTransaction: withdrawalTransaction,
      toTransaction: depositTransaction
    };
  }

  freezeAccount(accountNumber, adminApproval = false) {
    if (!adminApproval) {
      throw new Error('تجميد الحساب يحتاج موافقة مدير');
    }

    const account = this.getAccount(accountNumber);
    account.freeze();
    return `تم تجميد الحساب ${accountNumber}`;
  }

  unfreezeAccount(accountNumber, adminApproval = false) {
    if (!adminApproval) {
      throw new Error('فك تجميد الحساب يحتاج موافقة مدير');
    }

    const account = this.getAccount(accountNumber);
    account.unfreeze();
    return `تم فك تجميد الحساب ${accountNumber}`;
  }

  getAllAccounts() {
    return Array.from(this.accounts.values());
  }

  getAccountsCount() {
    return this.accounts.size;
  }

  deleteAccount(accountNumber, adminApproval = false) {
    if (!adminApproval) {
      throw new Error('حذف الحساب يحتاج موافقة مدير');
    }

    const account = this.getAccount(accountNumber);
    if (account.balance > 0) {
      throw new Error('لا يمكن حذف حساب يحتوي على رصيد');
    }

    this.accounts.delete(accountNumber);
    return `تم حذف الحساب ${accountNumber}`;
  }
}

