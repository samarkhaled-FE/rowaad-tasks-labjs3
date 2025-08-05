import { getCurrentTimestamp } from './Helpers.js';

export class Transaction {
  constructor(type, amount, accountNumber, description = '', targetAccount = null) {
    this.id = this.generateTransactionId();
    this.type = type;
    this.amount = amount;
    this.accountNumber = accountNumber;
    this.targetAccount = targetAccount;
    this.description = description;
    this.timestamp = getCurrentTimestamp();
  }

  generateTransactionId() {
    return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  }

  toString() {
    return `${this.timestamp.toISOString()} - ${this.type.toUpperCase()}: $${this.amount} - ${this.description}`;
  }
}

