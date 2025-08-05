import { isWithinTimeFrame } from './Helpers.js';

export class FraudDetector {
  constructor() {
    this.suspiciousActivities = [];
    this.transactionHistory = new Map(); // accountNumber -> [{ timestamp, amount }]
  }

  // الكشف عن المعاملات الكبيرة
  checkLargeTransaction(transaction) {
    if (transaction.amount > 10000) {
      const alert = {
        type: 'Large Transaction',
        transactionId: transaction.id,
        accountNumber: transaction.accountNumber,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        message: `تنبيه: معاملة كبيرة تتجاوز 10,000 دولار للحساب ${transaction.accountNumber}.`
      };
      this.suspiciousActivities.push(alert);
      return alert;
    }
    return null;
  }

  // الكشف عن المعاملات المتتالية المشبوهة
  checkConsecutiveTransactions(transaction) {
    const accountNumber = transaction.accountNumber;
    if (!this.transactionHistory.has(accountNumber)) {
      this.transactionHistory.set(accountNumber, []);
    }

    const accountTransactions = this.transactionHistory.get(accountNumber);
    accountTransactions.push({ timestamp: transaction.timestamp, amount: transaction.amount });

    // إبقاء آخر 3 معاملات فقط لتجنب تراكم البيانات
    if (accountTransactions.length > 3) {
      accountTransactions.shift();
    }

    // التحقق إذا كانت هناك 3 معاملات متتالية خلال 5 دقائق
    if (accountTransactions.length === 3) {
      const [firstTxn, secondTxn, thirdTxn] = accountTransactions;

      const isSuspicious = 
        isWithinTimeFrame(firstTxn.timestamp, secondTxn.timestamp, 5) &&
        isWithinTimeFrame(secondTxn.timestamp, thirdTxn.timestamp, 5);

      if (isSuspicious) {
        const alert = {
          type: 'Consecutive Transactions',
          accountNumber: accountNumber,
          transactions: accountTransactions,
          timestamp: new Date(),
          message: `تنبيه: 3 معاملات متتالية مشبوهة خلال 5 دقائق للحساب ${accountNumber}.`
        };
        this.suspiciousActivities.push(alert);
        // مسح السجل لهذا الحساب لتجنب التنبيهات المتكررة لنفس المجموعة
        this.transactionHistory.set(accountNumber, []); 
        return alert;
      }
    }
    return null;
  }

  // دالة شاملة للتحقق من الاحتيال
  detectFraud(transaction) {
    const alerts = [];
    const largeTxnAlert = this.checkLargeTransaction(transaction);
    if (largeTxnAlert) {
      alerts.push(largeTxnAlert);
    }

    // يجب إضافة المعاملة إلى السجل قبل التحقق من المعاملات المتتالية
    // ولكن يجب أن تكون المعاملة التي يتم التحقق منها هي الأخيرة في السجل
    // لذلك، سنقوم بإضافة المعاملة هنا ثم التحقق
    const consecutiveTxnAlert = this.checkConsecutiveTransactions(transaction);
    if (consecutiveTxnAlert) {
      alerts.push(consecutiveTxnAlert);
    }

    return alerts;
  }

  getSuspiciousActivities() {
    return [...this.suspiciousActivities];
  }

  clearSuspiciousActivities() {
    this.suspiciousActivities = [];
  }
}

