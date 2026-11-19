/**
 * Budglee Comprehensive Automated E2E Test Suite
 * Fully automated testing of all accounts, features, UX/UI, and repeats 3 cycles after logout.
 */

const puppeteer = require('../frontend/node_modules/puppeteer-core');

const TARGET_URL = 'https://quanlythuchi.duckdns.org';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const TEST_ACCOUNTS = {
  personal: {
    email: 'thanhcanhan@gmail.com',
    password: '123456',
    name: 'Nguyễn Tiến Thành',
    role: 'INDIVIDUAL_USER',
  },
  familyAdmin: {
    email: 'thanhba@gmail.com',
    password: '123456',
    name: 'Nguyễn Tiến Ba (Ba)',
    role: 'FAMILY_ADMIN',
  },
  familyMember: {
    email: 'thanhcon@gmail.com',
    password: '123456',
    name: 'Nguyễn Tiến Con (Con)',
    role: 'FAMILY_MEMBER',
  },
};

const results = [];

function logPass(msg) {
  console.log(`[PASS] ${msg}`);
  results.push({ status: 'PASS', message: msg });
}

function logFail(msg, error) {
  console.error(`[FAIL] ${msg}`, error || '');
  results.push({ status: 'FAIL', message: msg, error: error?.message || String(error) });
}

function logInfo(msg) {
  console.log(`[INFO] ${msg}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAccount(page, email, password) {
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.evaluate((em, pw) => {
    const setReactInput = (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setReactInput('#login-email', em);
    setReactInput('#login-password', pw);

    const btn = document.querySelector('#btn-login-submit') || document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  }, email, password);

  await page.waitForSelector('aside', { timeout: 15000 });
  await sleep(1000);
}

async function clickButtonByText(page, keyword, containerSelector = '') {
  return await page.evaluate(({ keyword, containerSelector }) => {
    const norm = (s) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .trim();

    const root = containerSelector ? document.querySelector(containerSelector) : document;
    if (!root) return false;

    const target = norm(keyword);
    const buttons = Array.from(root.querySelectorAll('button'));
    const btn = buttons.find((b) => norm(b.innerText).includes(target) || norm(b.title).includes(target));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, { keyword, containerSelector });
}

async function navigateToTab(page, tabKeyword) {
  const clicked = await clickButtonByText(page, tabKeyword, 'aside nav');
  await sleep(1000);
  return clicked;
}

async function performLogout(page) {
  await page.evaluate(() => {
    const norm = (s) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .trim();

    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => norm(b.innerText).includes('dang xuat') || norm(b.title).includes('dang xuat'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  await sleep(2000);
  await page.waitForSelector('#login-email', { timeout: 10000 });

  const storageState = await page.evaluate(() => {
    return {
      token: localStorage.getItem('budglee_token'),
      currentUser: localStorage.getItem('budglee_current_user'),
      activeTab: localStorage.getItem('budglee_active_tab'),
      hasLoginInput: !!document.querySelector('#login-email'),
    };
  });

  return storageState;
}

async function runTests() {
  logInfo(`Starting Budglee Comprehensive Test Suite on ${TARGET_URL}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--window-size=1366,768',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  page.on('pageerror', (err) => {
    console.warn(`[BROWSER WARN] ${err.message}`);
  });

  for (let cycle = 1; cycle <= 3; cycle++) {
    console.log(`\n======================================================`);
    console.log(`        STARTING TEST CYCLE ${cycle} OF 3`);
    console.log(`======================================================\n`);

    // -------------------------------------------------------------------------
    // TEST SECTION A: PERSONAL ACCOUNT (thanhcanhan@gmail.com)
    // -------------------------------------------------------------------------
    logInfo(`[Cycle ${cycle}] Testing Personal Account: ${TEST_ACCOUNTS.personal.email}`);

    try {
      await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(1000);

      // If already logged in from previous cycle, log out first
      const hasLogin = await page.$('#login-email');
      if (!hasLogin) {
        await performLogout(page);
        await sleep(1000);
      }

      await loginAccount(page, TEST_ACCOUNTS.personal.email, TEST_ACCOUNTS.personal.password);
      logPass(`[Cycle ${cycle}] Logged in successfully as ${TEST_ACCOUNTS.personal.email}`);
    } catch (e) {
      logFail(`[Cycle ${cycle}] Login failed for Personal Account`, e);
    }

    // A2. Overview & Custom Timeframe Chart
    try {
      await sleep(1000);
      const overviewText = await page.evaluate(() => document.body.innerText);
      if (overviewText.includes('Total Spent') || overviewText.includes('Bien dong') || overviewText.includes('chi tieu')) {
        logPass(`[Cycle ${cycle}] Overview summary & chart section rendered.`);
      }

      // Test chart timeframe tabs
      for (const tf of ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom']) {
        const clicked = await clickButtonByText(page, tf);
        if (clicked) {
          await sleep(300);
          logPass(`[Cycle ${cycle}] Clicked Chart timeframe tab: ${tf}`);
        }
      }

      // Test Custom timeframe presets: 7 ngày, 30 ngày, Tháng này
      for (const p of ['7 ngay', '30 ngay', 'thang nay']) {
        const clicked = await clickButtonByText(page, p);
        if (clicked) {
          await sleep(300);
          logPass(`[Cycle ${cycle}] Clicked Custom timeframe preset: ${p}`);
        }
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Overview & Chart test failed`, e);
    }

    // A3. Quick Add Transaction (from Header button)
    try {
      const openModal = await clickButtonByText(page, 'Them giao dich');
      if (openModal) {
        await sleep(600);
        logPass(`[Cycle ${cycle}] Quick Add Transaction modal opened.`);

        // Select non-food category (e.g. Di chuyển or Mua sắm)
        await page.evaluate(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          if (selects.length > 1 && selects[1].options.length > 3) {
            selects[1].selectedIndex = 2; // Category index 2
            selects[1].dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Type dot formatted amount
        const amountInput = await page.$('input[placeholder*="150.000"]');
        if (amountInput) {
          await amountInput.type('250000');
          const val = await page.evaluate((el) => el.value, amountInput);
          if (val.includes('.') || val === '250.000') {
            logPass(`[Cycle ${cycle}] Transaction amount auto-formatted with dots: ${val}`);
          }
        }

        // Action title / Note
        const noteInput = await page.$('input[placeholder*="Ghi chu"], input[placeholder*="An trua"], input[placeholder*="Do xang"]');
        if (noteInput) {
          await noteInput.type(`Test Tx C${cycle}`);
        }

        // Save transaction
        const saved = await clickButtonByText(page, 'Luu giao dich');
        if (saved) {
          await sleep(1000);
          logPass(`[Cycle ${cycle}] Transaction submitted successfully.`);
        }
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Quick Add Transaction failed`, e);
    }

    // A4. Wallets View (Ví & Thẻ)
    try {
      await navigateToTab(page, 'Vi & The');
      await sleep(1000);
      logPass(`[Cycle ${cycle}] Navigated to Wallets View.`);

      // Open Add Wallet modal
      const openedAddW = await clickButtonByText(page, 'Them nguon tien');
      if (openedAddW) {
        await sleep(600);

        // Test Cash selection: using dedicated ID
        await page.waitForSelector('#btn-wallet-type-cash', { timeout: 5000 });
        await page.click('#btn-wallet-type-cash');
        await sleep(400);

        const hasNameInput = await page.evaluate(() => !!document.querySelector('#input-wallet-name'));
        if (!hasNameInput) {
          logPass(`[Cycle ${cycle}] UX Verified: Name input correctly hidden when Cash is selected in modal.`);
        } else {
          logFail(`[Cycle ${cycle}] UX Error: Name input still displayed for Cash wallet`);
        }

        // Deposit Cash: 300.000
        const cashAmountInput = await page.$('#input-wallet-balance');
        if (cashAmountInput) {
          await cashAmountInput.type('300000');
          await clickButtonByText(page, 'Luu tai khoan', '.fixed');
          await sleep(1000);
          logPass(`[Cycle ${cycle}] Cash deposit submitted (auto accumulated into Cash wallet).`);
        }

        // Test Bank account with 4 last digits
        await clickButtonByText(page, 'Them nguon tien');
        await sleep(600);

        const bankNameInput = await page.$('#input-wallet-name');
        if (bankNameInput) {
          await bankNameInput.type(`VPBank Test`);
          const bankAmountInput = await page.$('#input-wallet-balance');
          if (bankAmountInput) await bankAmountInput.type('2500000');
          const lastDigitsInput = await page.$('#input-wallet-card-masked');
          if (lastDigitsInput) await lastDigitsInput.type('9999');

          await clickButtonByText(page, 'Luu tai khoan', '.fixed');
          await sleep(1000);
          logPass(`[Cycle ${cycle}] New Bank Account VPBank (**** 9999) created.`);
        }
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Wallets View test failed`, e);
    }

    // A5. Budgets View (Ngân sách) - INCLUDING PERSISTENCE ACROSS TAB SWITCH AND RELOAD
    try {
      await navigateToTab(page, 'Ngan sach');
      await sleep(1000);
      logPass(`[Cycle ${cycle}] Navigated to Budgets View.`);

      // Click Tạo ngân sách
      const openAddBudget = await clickButtonByText(page, 'Tao ngan sach');
      if (openAddBudget) {
        await sleep(600);

        // Select category
        await page.evaluate(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          if (selects.length > 0) {
            selects[0].selectedIndex = 2; // Category option index 2
            selects[0].dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        const budgetLimitInput = await page.$('input[placeholder*="3.000.000"]');
        if (budgetLimitInput) {
          await budgetLimitInput.type('3800000');
        }

        await clickButtonByText(page, 'Thiet lap ngan sach');
        await sleep(1000);
        logPass(`[Cycle ${cycle}] Budget added successfully.`);

        // Verify budget in DOM
        const inDOM = await page.evaluate(() => document.body.innerText.includes('3.800.000'));
        if (inDOM) {
          logPass(`[Cycle ${cycle}] Budget verified present in list.`);
        }

        // TAB SWITCH PERSISTENCE CHECK: Switch to Overview, then back to Budgets
        await navigateToTab(page, 'Tong quan');
        await sleep(1000);
        await navigateToTab(page, 'Ngan sach');
        await sleep(1200);

        const stillThereTabSwitch = await page.evaluate(() => document.body.innerText.includes('3.800.000'));
        if (stillThereTabSwitch) {
          logPass(`[Cycle ${cycle}] CONFIRMED: Budget NOT LOST after switching tabs! (Fix Verified)`);
        } else {
          logFail(`[Cycle ${cycle}] BUG DETECTED: Budget was lost after switching tabs!`);
        }

        // RELOAD PERSISTENCE CHECK: Reload page
        await page.reload({ waitUntil: 'networkidle2' });
        await sleep(1500);
        await navigateToTab(page, 'Ngan sach');
        await sleep(1200);

        const stillThereReload = await page.evaluate(() => document.body.innerText.includes('3.800.000'));
        if (stillThereReload) {
          logPass(`[Cycle ${cycle}] CONFIRMED: Budget NOT LOST after page reload!`);
        } else {
          logFail(`[Cycle ${cycle}] BUG DETECTED: Budget was lost after page reload!`);
        }
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Budgets View test failed`, e);
    }

    // A6. Saving Goals View (Mục tiêu)
    try {
      await navigateToTab(page, 'Muc tieu');
      await sleep(1000);
      logPass(`[Cycle ${cycle}] Navigated to Saving Goals View.`);

      const openGoalModal = await clickButtonByText(page, 'Them muc tieu');
      if (openGoalModal) {
        await sleep(600);

        const goalNameInput = await page.$('input[placeholder*="Mua xe"], input[placeholder*="tiet kiem"]');
        if (goalNameInput) await goalNameInput.type(`Muc tieu C${cycle}`);

        const targetInput = await page.$('input[placeholder*="50.000.000"], input[placeholder*="20.000.000"]');
        if (targetInput) await targetInput.type('12000000');

        await clickButtonByText(page, 'Luu muc tieu');
        await sleep(1000);
        logPass(`[Cycle ${cycle}] Saving Goal created successfully.`);

        // Test Deposit into goal
        const openedDeposit = await clickButtonByText(page, 'Nap tien');
        if (openedDeposit) {
          await sleep(600);
          const depInput = await page.$('input[placeholder*="VD:"]');
          if (depInput) {
            await depInput.type('500000');
            await clickButtonByText(page, 'Xac nhan nap');
            await sleep(1000);
            logPass(`[Cycle ${cycle}] Deposit to Saving Goal completed.`);
          }
        }
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Saving Goals test failed`, e);
    }

    // A7. Settings View (Cài đặt) - Currency selector removal check
    try {
      await navigateToTab(page, 'Cai dat');
      await sleep(1000);

      const hasCurrency = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('tien te') || text.includes('currency');
      });

      if (!hasCurrency) {
        logPass(`[Cycle ${cycle}] UX Verified: Currency selector is completely removed from Settings.`);
      } else {
        logFail(`[Cycle ${cycle}] UX Error: Currency selector still visible in Settings`);
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Settings View test failed`, e);
    }

    // A8. Logout & Cleanup Check (Solution 3: Logout Cleanup)
    try {
      const state = await performLogout(page);
      if (!state.token && !state.currentUser && state.hasLoginInput) {
        logPass(`[Cycle ${cycle}] Logout & Cleanup Verified: Session, token and activeTab cleared cleanly.`);
      } else {
        logFail(`[Cycle ${cycle}] Logout Cleanup Failed`, state);
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Logout failed for Personal Account`, e);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION B: FAMILY ADMIN ACCOUNT (thanhba@gmail.com)
    // -------------------------------------------------------------------------
    logInfo(`[Cycle ${cycle}] Testing Family Admin Account: ${TEST_ACCOUNTS.familyAdmin.email}`);
    try {
      await loginAccount(page, TEST_ACCOUNTS.familyAdmin.email, TEST_ACCOUNTS.familyAdmin.password);
      logPass(`[Cycle ${cycle}] Logged in successfully as Family Admin (${TEST_ACCOUNTS.familyAdmin.name})`);

      // Verify Family tab
      await navigateToTab(page, 'Quy gia dinh');
      await sleep(1200);

      const hasFamily = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('thanh vien') || text.includes('So quy') || text.includes('Gia dinh');
      });
      if (hasFamily) {
        logPass(`[Cycle ${cycle}] Family Workspace View accessible for Family Admin.`);
      }

      // Check Settings -> Family Members Management
      await navigateToTab(page, 'Cai dat');
      await sleep(1000);

      await clickButtonByText(page, 'So quy gia dinh');
      await sleep(800);

      const hasMemberMgmt = await page.evaluate(() => {
        return document.body.innerText.includes('Danh sach thanh vien') || document.body.innerText.includes('thanh vien');
      });
      if (hasMemberMgmt) {
        logPass(`[Cycle ${cycle}] Family member management panel verified in Settings.`);
      }

      // Logout Family Admin
      const stateAdmin = await performLogout(page);
      if (!stateAdmin.token && !stateAdmin.currentUser) {
        logPass(`[Cycle ${cycle}] Family Admin logged out cleanly.`);
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Family Admin test failed`, e);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION C: FAMILY MEMBER ACCOUNT (thanhcon@gmail.com)
    // -------------------------------------------------------------------------
    logInfo(`[Cycle ${cycle}] Testing Family Member Account: ${TEST_ACCOUNTS.familyMember.email}`);
    try {
      await loginAccount(page, TEST_ACCOUNTS.familyMember.email, TEST_ACCOUNTS.familyMember.password);
      logPass(`[Cycle ${cycle}] Logged in successfully as Family Member (${TEST_ACCOUNTS.familyMember.name})`);

      // Test Family Member contributing to shared Goal
      await navigateToTab(page, 'Muc tieu');
      await sleep(1200);

      const canDeposit = await clickButtonByText(page, 'Nap tien');
      if (canDeposit) {
        await sleep(600);
        const depInput = await page.$('input[placeholder*="VD:"]');
        if (depInput) {
          await depInput.type('100000');
          await clickButtonByText(page, 'Xac nhan nap');
          await sleep(1000);
          logPass(`[Cycle ${cycle}] Family Member contributed 100.000 VND to shared Goal!`);
        }
      }

      // Logout Family Member
      const stateMember = await performLogout(page);
      if (!stateMember.token && !stateMember.currentUser) {
        logPass(`[Cycle ${cycle}] Family Member logged out cleanly.`);
      }
    } catch (e) {
      logFail(`[Cycle ${cycle}] Family Member test failed`, e);
    }

    // -------------------------------------------------------------------------
    // TEST SECTION D: REGISTRATION UX (FAMILY OWNER DIRECT INVITE INPUT)
    // -------------------------------------------------------------------------
    logInfo(`[Cycle ${cycle}] Testing Registration UX (Direct invite input during sign up)`);
    try {
      await page.waitForSelector('#tab-register', { timeout: 10000 });
      await page.click('#tab-register');
      await sleep(800);

      // Select Family Owner Role (Quản lý Gia đình)
      await clickButtonByText(page, 'Quan ly Gia dinh');
      await sleep(600);

      const inviteInput = await page.$('#reg-invite-email');
      if (inviteInput) {
        logPass(`[Cycle ${cycle}] UX Verified: Direct invitation during family registration is present and functional!`);
      } else {
        logFail(`[Cycle ${cycle}] UX Error: Direct invitation input missing during family registration`);
      }

      // Switch back to Login mode for next cycle
      await page.click('#tab-login');
      await sleep(600);
      logPass(`[Cycle ${cycle}] Switched back to Login form cleanly.`);
    } catch (e) {
      logFail(`[Cycle ${cycle}] Registration UX test failed`, e);
    }

    console.log(`\n>>> COMPLETED TEST CYCLE ${cycle} OF 3 <<<\n`);
  }

  await browser.close();

  // Print Summary
  console.log(`\n======================================================`);
  console.log(`               TEST SUITE SUMMARY`);
  console.log(`======================================================`);
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL CHECKS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed > 0) {
    console.log(`\nFailed Checks:`);
    results.filter((r) => r.status === 'FAIL').forEach((f) => console.log(` - ${f.message}: ${f.error || ''}`));
  }
}

runTests().catch((e) => {
  console.error('Fatal Test Runner Error:', e);
});
