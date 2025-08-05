import { Transaction } from './Transaction.js';

export class TransactionManager {
  constructor() {
    this.allTransactions = [];
  }

  addTransaction(transaction) {
    this.allTransactions.push(transaction);
  }

  getTransactionsByAccount(accountNumber) {
    return this.allTransactions.filter(t => 
      t.accountNumber === accountNumber || t.targetAccount === accountNumber
    );
  }

  getTransactionsByType(type) {
    return this.allTransactions.filter(t => t.type === type);
  }

  getTransactionsByDateRange(startDate, endDate) {
    return this.allTransactions.filter(t => 
      t.timestamp >= startDate && t.timestamp <= endDate
    );
  }

  getTransactionsByAccountAndDateRange(accountNumber, startDate, endDate) {
    return this.allTransactions.filter(t => 
      (t.accountNumber === accountNumber || t.targetAccount === accountNumber) &&
      t.timestamp >= startDate && t.timestamp <= endDate
    );
  }

  getRecentTransactions(accountNumber, count = 10) {
    const accountTransactions = this.getTransactionsByAccount(accountNumber);
    return accountTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  getAllTransactions() {
    return [...this.allTransactions];
  }

  getTransactionById(transactionId) {
    return this.allTransactions.find(t => t.id === transactionId);
  }

  getTransactionStats() {
    const stats = {
      total: this.allTransactions.length,
      byType: {},
      totalAmount: 0
    };

    this.allTransactions.forEach(transaction => {
      // إحصائيات حسب النوع
      if (!stats.byType[transaction.type]) {
        stats.byType[transaction.type] = 0;
      }
      stats.byType[transaction.type]++;

      // إجمالي المبالغ
      stats.totalAmount += transaction.amount;
    });

    return stats;
  }
}

