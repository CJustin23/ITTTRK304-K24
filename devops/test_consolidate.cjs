const testWallets = [
  { id: 12, walletName: 'VietinBank', type: 'CREDIT_CARD', balance: 49130000, cardNumberMasked: '**** 8529' },
  { id: 17, walletName: 'vietinbank', type: 'CASH', balance: 250000, cardNumberMasked: '' },
  { id: 18, walletName: 'MOMO', type: 'BANK', balance: 90000000, cardNumberMasked: '**** 6325' },
  { id: 25, walletName: 'Tiền mặt', type: 'CASH', balance: 2000000, cardNumberMasked: '' },
  { id: 31, walletName: 'VietinBank', type: 'BANK', balance: 2000000, cardNumberMasked: '**** 8529' },
  { id: 99, walletName: 'VietinBank', type: 'BANK', balance: 5000000, cardNumberMasked: '**** 8529' },
];

function consolidateWallets(wallets) {
  if (!Array.isArray(wallets) || wallets.length === 0) return [];
  const consolidated = [];
  for (const raw of wallets) {
    if (!raw) continue;
    const w = {
      ...raw,
      walletName: raw.type === 'CASH' ? 'Tiền mặt' : (raw.walletName || 'Ví chính').trim(),
      balance: Number(raw.balance || 0),
      cardNumberMasked: raw.type === 'CASH' ? '' : (raw.cardNumberMasked || '').trim(),
    };
    const type = w.type || 'BANK';
    const nameLower = w.walletName.toLowerCase();
    const cardDigits = w.cardNumberMasked.replace(/\D/g, '').slice(-4);
    let isMerged = false;

    for (let i = 0; i < consolidated.length; i++) {
      const ex = consolidated[i];
      const exType = ex.type || 'BANK';
      const exNameLower = (ex.walletName || '').trim().toLowerCase();
      const exCardDigits = (ex.cardNumberMasked || '').replace(/\D/g, '').slice(-4);

      if (type === 'CASH' && exType === 'CASH') {
        consolidated[i] = {
          ...ex,
          walletName: 'Tiền mặt',
          type: 'CASH',
          cardNumberMasked: '',
          balance: Number((ex.balance + w.balance).toFixed(2)),
        };
        isMerged = true;
        break;
      }

      if ((type === 'BANK' || type === 'CREDIT_CARD') && exType === type && exNameLower === nameLower) {
        const sameDigits = (cardDigits && exCardDigits && cardDigits === exCardDigits) || (!cardDigits && !exCardDigits);
        if (sameDigits) {
          consolidated[i] = {
            ...ex,
            cardNumberMasked: ex.cardNumberMasked || w.cardNumberMasked || (cardDigits ? `**** ${cardDigits}` : ''),
            balance: Number((ex.balance + w.balance).toFixed(2)),
          };
          isMerged = true;
          break;
        }
      }
    }
    if (!isMerged) consolidated.push(w);
  }
  return consolidated;
}

const res = consolidateWallets(testWallets);
console.log(JSON.stringify(res, null, 2));
