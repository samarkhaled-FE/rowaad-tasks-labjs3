import { TransactionFilter } from './TransactionFilter.js';
import { ACCOUNT_TYPES } from './Constants.js';

export class ReportGenerator {
  constructor(accountManager, transactionManager) {
    this.accountManager = accountManager;
    this.transactionManager = transactionManager;
  }

  generateAccountSummary(accountNumber) {
    try {
      const account = this.accountManager.getAccount(accountNumber);
      const accountInfo = account.getAccountInfo();
      const transactions = this.transactionManager.getTransactionsByAccount(accountNumber);

      return {
        accountInfo,
        transactionCount: transactions.length,
        totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
        latestTransactions: transactions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  generateAllAccountsOverview() {
    const allAccounts = this.accountManager.getAllAccounts();
    const overview = {
      totalAccounts: allAccounts.length,
      totalBalance: allAccounts.reduce((sum, acc) => sum + acc.getBalance(), 0),
      checkingAccounts: allAccounts.filter(acc => acc.accountType === ACCOUNT_TYPES.CHECKING).length,
      savingsAccounts: allAccounts.filter(acc => acc.accountType === ACCOUNT_TYPES.SAVINGS).length,
      frozenAccounts: allAccounts.filter(acc => acc.isFrozen).length,
      accountsSummary: allAccounts.map(acc => acc.getAccountInfo())
    };
    return overview;
  }

  generateTransactionReport(criteria = {}) {
    const allTransactions = this.transactionManager.getAllTransactions();
    const filter = TransactionFilter.createFilter(allTransactions);
    const filteredTransactions = filter.advancedFilter(criteria).sortByDate(false).getResults();

    return {
      totalTransactions: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
      transactions: filteredTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        accountNumber: t.accountNumber,
        targetAccount: t.targetAccount,
        description: t.description,
        timestamp: t.timestamp.toISOString()
      }))
    };
  }

  generateFraudReport() {
    // Assuming FraudDetector instance is passed or accessible
    // For now, this will be a placeholder or require passing the detector
    // In a real app, FraudDetector would likely emit events or store alerts centrally
    return { message: "Fraud report generation not yet fully implemented. Requires FraudDetector alerts." };
  }

  // يمكن إضافة المزيد من التقارير هنا
  // مثل: تقرير الفوائد المطبقة، تقرير السحوبات اليومية، إلخ.
}

