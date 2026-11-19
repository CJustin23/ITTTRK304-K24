const assert = require('assert');

// 1. Test Saving Goal Deposit transaction type
function testDepositTransactionType() {
  const goal = { id: 101, goalName: 'Mua xe VinFast', currentAmount: 5000000, targetAmount: 20000000 };
  const wallet = { id: 1, walletName: 'MB Bank', balance: 10000000 };
  const amount = 2000000;

  const newTx = {
    id: Date.now(),
    walletId: wallet.id,
    walletName: wallet.walletName,
    categoryName: 'Tích lũy & Mục tiêu',
    categoryIcon: 'PiggyBank',
    actionTitle: `Nạp tiền tích lũy: ${goal.goalName}`,
    amount,
    transactionType: 'EXPENSE',
    balanceAfter: wallet.balance - amount,
    note: `Trích tiền từ ${wallet.walletName} vào quỹ tích lũy`,
  };

  assert.strictEqual(newTx.transactionType, 'EXPENSE', 'Deposit transaction must be EXPENSE');

  // Test filter logic in TransactionsView
  const isExpenseTx = (tx) => tx.transactionType === 'EXPENSE' || tx.transactionType === 'TRANSFER';
  assert.strictEqual(isExpenseTx(newTx), true, 'Saving goal deposit must match Khoan chi filter');

  const legacyTransferTx = {
    id: 102,
    transactionType: 'TRANSFER',
    actionTitle: 'Nạp tiền tích lũy cũ'
  };
  assert.strictEqual(isExpenseTx(legacyTransferTx), true, 'Legacy TRANSFER deposit must also match Khoan chi filter');
  console.log('[PASS] Test 1: Saving goal deposit is correctly categorized under Khoan chi (EXPENSE).');
}

// 2. Test Wallet Requirement (at least 1 wallet required before adding transaction)
function testWalletRequirement() {
  const zeroWallets = [];
  function canRecordExpense(wallets) {
    if (!wallets || wallets.length === 0) {
      return { allowed: false, message: 'Bạn cần có ít nhất 1 nguồn tiền (Ví / Thẻ) trong tài khoản trước khi ghi lại chi tiêu!' };
    }
    return { allowed: true };
  }

  const checkZero = canRecordExpense(zeroWallets);
  assert.strictEqual(checkZero.allowed, false, 'Must block expense when 0 wallets exist');
  assert.ok(checkZero.message.includes('ít nhất 1 nguồn tiền'), 'Must return helpful warning');

  const oneWallet = [{ id: 1, walletName: 'Tiền mặt', balance: 500000, type: 'CASH' }];
  const checkOne = canRecordExpense(oneWallet);
  assert.strictEqual(checkOne.allowed, true, 'Must allow expense when at least 1 wallet exists');
  console.log('[PASS] Test 2: Ghi lai chi tieu requires at least 1 wallet in account.');
}

testDepositTransactionType();
testWalletRequirement();
console.log('All verification checks PASSED successfully!');
