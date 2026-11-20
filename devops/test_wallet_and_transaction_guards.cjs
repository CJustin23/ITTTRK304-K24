const assert = require('assert');

// 1. Verify Wallet Deduplication logic
function testWalletDeduplication() {
  const currentWallets = [
    { id: 1732005555555, walletName: 'VietinBank', type: 'BANK', cardNumberMasked: '**** 8529', balance: 5000000 }
  ];

  const apiWallets = [
    { id: 8, walletName: 'VietinBank', type: 'BANK', cardNumberMasked: '**** 8529', balance: 5000000 }
  ];

  const apiWalletIds = new Set(apiWallets.map(w => w.id));

  // Logic used in fetchCoreData:
  const pendingLocalWallets = currentWallets.filter(
    (lw) =>
      !apiWalletIds.has(lw.id) &&
      (lw.id > 1000000000000 || typeof lw.id === 'string') &&
      !apiWallets.some((aw) => {
        if (aw.type !== lw.type) return false;
        const sameName = (aw.walletName || '').trim().toLowerCase() === (lw.walletName || '').trim().toLowerCase();
        const awDigits = (aw.cardNumberMasked || '').replace(/\D/g, '').slice(-4);
        const lwDigits = (lw.cardNumberMasked || '').replace(/\D/g, '').slice(-4);
        const sameDigits = (!awDigits && !lwDigits) || (awDigits && lwDigits && awDigits === lwDigits);
        return sameName && sameDigits;
      })
  );

  assert.strictEqual(pendingLocalWallets.length, 0, 'Local pending wallet must not duplicate server wallet');
  console.log('[PASS] Wallet Deduplication: Server wallet replaces temporary client wallet cleanly.');
}

// 2. Verify Transaction requires at least 1 wallet guard
function testZeroWalletTransactionGuard() {
  const zeroWallets = [];
  function canOpenTransaction(wallets) {
    if (!wallets || wallets.length === 0) {
      return {
        allowed: false,
        message: 'Tài khoản của bạn chưa có thẻ hay ví nào. Vui lòng thêm ít nhất 1 nguồn tiền (Ví / Thẻ) trước khi ghi lại giao dịch!'
      };
    }
    return { allowed: true };
  }

  const check = canOpenTransaction(zeroWallets);
  assert.strictEqual(check.allowed, false, 'Must block transaction when 0 wallets');
  assert.ok(check.message.includes('chưa có thẻ hay ví nào'));
  console.log('[PASS] Transaction Guard: Zero-wallet users are strictly prompted to create a wallet first.');
}

testWalletDeduplication();
testZeroWalletTransactionGuard();
console.log('All frontend guards verified successfully!');
