import { Account } from './Account.js';
import { ACCOUNT_TYPES, TRANSACTION_TYPES, MIN_BALANCE_FOR_INTEREST } from './Constants.js';
import { Transaction } from './Transaction.js';

export class SavingsAccount extends Account {
  constructor(accountHolderName, initialDeposit, interestRate = 0.02) {
    super(accountHolderName, initialDeposit, ACCOUNT_TYPES.SAVINGS);
    this.interestRate = interestRate; // معدل الفائدة الشهرية
    this.lastInterestDate = new Date();
  }

  calculateMonthlyInterest() {
    if (this.balance <= MIN_BALANCE_FOR_INTEREST) {
      return 0;
    }

    const interest = this.balance * this.interestRate;
    return interest;
  }

  applyMonthlyInterest() {
    if (this.isFrozen) {
      throw new Error('الحساب مجمد، لا يمكن تطبيق الفائدة');
    }

    const interest = this.calculateMonthlyInterest();
    
    if (interest > 0) {
      this.balance += interest;
      const transaction = new Transaction(
        TRANSACTION_TYPES.INTEREST, 
        interest, 
        this.accountNumber, 
        'فائدة شهرية مركبة'
      );
      this.addTransaction(transaction);
      this.lastInterestDate = new Date();
      return transaction;
    }
    
    return null;
  }

  getInterestRate() {
    return this.interestRate;
  }

  setInterestRate(newRate) {
    if (newRate < 0) {
      throw new Error('معدل الفائدة لا يمكن أن يكون سالباً');
    }
    this.interestRate = newRate;
  }

  getAccountInfo() {
    const baseInfo = super.getAccountInfo();
    return {
      ...baseInfo,
      interestRate: this.interestRate,
      lastInterestDate: this.lastInterestDate,
      eligibleForInterest: this.balance > MIN_BALANCE_FOR_INTEREST
    };
  }
}

