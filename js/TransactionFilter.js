export class TransactionFilter {
  constructor(transactions) {
    this.transactions = transactions;
  }

  filterByType(type) {
    return new TransactionFilter(
      this.transactions.filter(t => t.type === type)
    );
  }

  filterByDateRange(startDate, endDate) {
    return new TransactionFilter(
      this.transactions.filter(t => 
        t.timestamp >= startDate && t.timestamp <= endDate
      )
    );
  }

  filterByAccount(accountNumber) {
    return new TransactionFilter(
      this.transactions.filter(t => 
        t.accountNumber === accountNumber || t.targetAccount === accountNumber
      )
    );
  }

  filterByAmountRange(minAmount, maxAmount) {
    return new TransactionFilter(
      this.transactions.filter(t => 
        t.amount >= minAmount && t.amount <= maxAmount
      )
    );
  }

  filterByDescription(keyword) {
    return new TransactionFilter(
      this.transactions.filter(t => 
        t.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  sortByDate(ascending = false) {
    const sorted = [...this.transactions].sort((a, b) => {
      return ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });
    return new TransactionFilter(sorted);
  }

  sortByAmount(ascending = false) {
    const sorted = [...this.transactions].sort((a, b) => {
      return ascending ? a.amount - b.amount : b.amount - a.amount;
    });
    return new TransactionFilter(sorted);
  }

  limit(count) {
    return new TransactionFilter(
      this.transactions.slice(0, count)
    );
  }

  getResults() {
    return [...this.transactions];
  }

  count() {
    return this.transactions.length;
  }

  getTotalAmount() {
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  // دالة مساعدة لتطبيق فلاتر متعددة
  static createFilter(transactions) {
    return new TransactionFilter(transactions);
  }

  // فلترة متقدمة بمعايير متعددة
  advancedFilter(criteria) {
    let filtered = [...this.transactions];

    if (criteria.type) {
      filtered = filtered.filter(t => t.type === criteria.type);
    }

    if (criteria.startDate && criteria.endDate) {
      filtered = filtered.filter(t => 
        t.timestamp >= criteria.startDate && t.timestamp <= criteria.endDate
      );
    }

    if (criteria.accountNumber) {
      filtered = filtered.filter(t => 
        t.accountNumber === criteria.accountNumber || t.targetAccount === criteria.accountNumber
      );
    }

    if (criteria.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= criteria.minAmount);
    }

    if (criteria.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= criteria.maxAmount);
    }

    if (criteria.description) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(criteria.description.toLowerCase())
      );
    }

    // ترتيب النتائج (تنازلي بالتاريخ افتراضياً)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return new TransactionFilter(filtered);
  }
}

