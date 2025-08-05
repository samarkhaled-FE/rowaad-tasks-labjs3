export function generateAccountNumber() {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

export function isValidAmount(amount) {
  return typeof amount === 'number' && amount > 0;
}

export function getCurrentTimestamp() {
  return new Date();
}

export function isWithinTimeFrame(timestamp1, timestamp2, minutes) {
  const diffInMs = Math.abs(timestamp2 - timestamp1);
  const diffInMinutes = diffInMs / (1000 * 60);
  return diffInMinutes <= minutes;
}

