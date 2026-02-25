const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ALLOWED_CHAT_ID = process.env.ALLOWED_CHAT_ID; // optional security

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const ACCTS = ['F','D','M','C','3','Riv','E','FNTS','HARD'];

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getAccts(inv) {
  const state = (inv.state || '').toUpperCase();
  let accts = ACCTS.slice();
  if (state === 'NJ' || state === 'NEW JERSEY') accts.push('B');
  if (state === 'NY' || state === 'NEW YORK') accts = accts.filter(k => k !== '3');
  return accts;
}
function calcOwed(inv) {
  const accts = getAccts(inv);
  const ap = inv.acct_profits || {};
  let t = 0;
  for (const k of accts) t += Number(ap[k] || 0);
  const paid = (inv.payments || []).reduce((a, p) => a + (p.dir === 'out' ? -Number(p.amount || 0) : Number(p.amount || 0)), 0);
  let base = t * (inv.share / 100);
  if ((inv.funded || '').toLowerCase() === 'sands') {
    base += Number(inv.capital || 0);
  }
  (inv.extra_funding || []).forEach(ex => { if (ex.by === 'sands') base += Number(ex.amt || 0); });
  return base - paid;
}

function calcAP(inv) {
  const accts = getAccts(inv);
  const ap = inv.acct_profits || {};
  return accts.reduce((a, k) => a + Number(ap[k] || 0), 0);
}

async function findInvestor(name) {
  const { data } = await sb.from('investors').select('*');
  if (!data) return null;
  const q = name.toLowerCase();
  return data.find(i => (i.fname + ' ' + i.lname).toLowerCase().includes(q)) || null;
}

// ── Command Handlers ──

// /add John Doe NY 15 sands 10000
async function cmdAdd(chatId, args) {
  // args: firstname lastname state share funded capital
  if (args.length < 6) {
    return sendMessage(chatId, '❌ Usage: `/add FirstName LastName State SharePct funded(client/sands) Capital`\nExample: `/add John Doe NY 15 sands 10000`');
  }
  const fname = args[0];
  const lname = args[1];
  const state = args[2];
  const share = parseFloat(args[3]) || 0;
  const funded = args[4].toLowerCase();
  const capital = parseFloat(args[5]) || 0;

  const { data, error } = await sb.from('investors').insert({
    fname, lname, state, share, funded, capital,
    invested: capital, acct_profits: {}, payments: [], extra_funding: []
  }).select().single();

  if (error) return sendMessage(chatId, '❌ Error adding investor: ' + error.message);
  sendMessage(chatId, `✅ *${fname} ${lname}* added!\n📍 ${state} | ${share}% our way | Funded by ${funded}\n💰 Capital: ${fmt(capital)}`);
}

// /profit John Doe F 5000
async function cmdProfit(chatId, args) {
  if (args.length < 3) {
    return sendMessage(chatId, '❌ Usage: `/profit Name Account Amount`\nExample: `/profit John Doe F 5000`\nAccounts: F, D, M, C, 3, Riv, E, B');
  }
  const amount = parseFloat(args[args.length - 1]) || 0;
  const acct = args[args.length - 2].toUpperCase();
  const name = args.slice(0, args.length - 2).join(' ');

  if (!ACCTS.includes(acct)) {
    return sendMessage(chatId, `❌ Unknown account "${acct}". Valid: ${ACCTS.join(', ')}`);
  }

  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);

  const profits = inv.acct_profits || {};
  profits[acct] = amount;

  const { error } = await sb.from('investors').update({ acct_profits: profits }).eq('id', inv.id);
  if (error) return sendMessage(chatId, '❌ Error updating profit: ' + error.message);

  const newAP = calcAP({ ...inv, acct_profits: profits });
  sendMessage(chatId, `✅ *${inv.fname} ${inv.lname}* — Account *${acct}* set to ${fmt(amount)}\n📊 Total acct profit: ${fmt(newAP)}`);
}

// /paymentfrom John Doe 3000 Sands  (they paid us)
async function cmdPaymentFrom(chatId, args) {
  if (args.length < 3) {
    return sendMessage(chatId, '❌ Usage: `/paymentfrom Name Amount PaidTo`\nExample: `/paymentfrom John Doe 3000 Sands`');
  }
  const paidTo = args[args.length - 1];
  const amount = parseFloat(args[args.length - 2]) || 0;
  const name = args.slice(0, args.length - 2).join(' ');
  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);
  const payments = inv.payments || [];
  if (payments.length >= 5) return sendMessage(chatId, '❌ Max 5 payments per investor already reached.');
  payments.push({ amount, to: paidTo, dir: 'in' });
  const { error } = await sb.from('investors').update({ payments }).eq('id', inv.id);
  if (error) return sendMessage(chatId, '❌ Error recording payment: ' + error.message);
  const newOwed = calcOwed({ ...inv, payments });
  const owedLabel = newOwed < 0 ? `🟢 We owe them: ${fmt(Math.abs(newOwed))}` : `🔴 They owe us: ${fmt(newOwed)}`;
  sendMessage(chatId, `✅ Payment recorded for *${inv.fname} ${inv.lname}*\n📥 They paid us: ${fmt(amount)} → ${paidTo}\n${owedLabel}`);
}

// /paymentto John Doe 3000  (we paid them, Sands implied)
async function cmdPaymentTo(chatId, args) {
  if (args.length < 2) {
    return sendMessage(chatId, '❌ Usage: `/paymentto Name Amount`\nExample: `/paymentto John Doe 3000`');
  }
  const amount = parseFloat(args[args.length - 1]) || 0;
  const name = args.slice(0, args.length - 1).join(' ');
  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);
  const payments = inv.payments || [];
  if (payments.length >= 5) return sendMessage(chatId, '❌ Max 5 payments per investor already reached.');
  payments.push({ amount, to: 'Sands', dir: 'out' });
  const { error } = await sb.from('investors').update({ payments }).eq('id', inv.id);
  if (error) return sendMessage(chatId, '❌ Error recording payment: ' + error.message);
  const newOwed = calcOwed({ ...inv, payments });
  const owedLabel = newOwed < 0 ? `🟢 We owe them: ${fmt(Math.abs(newOwed))}` : `🔴 They owe us: ${fmt(newOwed)}`;
  sendMessage(chatId, `✅ Payment recorded for *${inv.fname} ${inv.lname}*\n📤 We paid them: ${fmt(amount)}\n${owedLabel}`);
}

// /balance John Doe
async function cmdBalance(chatId, args) {
  if (!args.length) return sendMessage(chatId, '❌ Usage: `/balance Name`\nExample: `/balance John Doe`');
  const name = args.join(' ');
  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);

  const ap = calcAP(inv);
  const owed = calcOwed(inv);
  const paid = (inv.payments || []).reduce((a, p) => a + (p.dir === 'out' ? -Number(p.amount || 0) : Number(p.amount || 0)), 0);
  const extraTotal = (inv.extra_funding || []).reduce((a, ex) => a + Number(ex.amt || 0), 0);
  const totalCapital = Number(inv.capital || 0) + extraTotal;
  const owedLabel = owed < 0 ? `🟢 We owe them: ${fmt(Math.abs(owed))}` : `🔴 They owe us: ${fmt(owed)}`;
  const apLabel = ap < 0 ? `📉 Acct Profit: ${fmt(ap)} (loss)` : `📈 Acct Profit: ${fmt(ap)}`;
  const capitalLabel = extraTotal > 0 ? `💰 Capital: ${fmt(totalCapital)} (${fmt(inv.capital)} + ${fmt(extraTotal)} extra)` : `💰 Capital: ${fmt(inv.capital)}`;

  sendMessage(chatId,
    `📋 *${inv.fname} ${inv.lname}*\n` +
    `📍 ${inv.state || '—'} | ${inv.share}% our way | ${inv.funded || '—'}\n` +
    `${apLabel}\n` +
    `${capitalLabel}\n` +
    `💸 Paid: ${fmt(paid)}\n` +
    owedLabel
  );
}

// /stats
async function cmdStats(chatId) {
  const { data: investors } = await sb.from('investors').select('*');
  if (!investors) return sendMessage(chatId, '❌ Could not load data.');

  const totalOwed = investors.reduce((a, i) => a + calcOwed(i), 0);
  const totalAP = investors.reduce((a, i) => a + calcAP(i), 0);
  const owingCount = investors.filter(i => calcOwed(i) > 0).length;

  sendMessage(chatId,
    `📊 *Fund Stats*\n` +
    `👥 Investors: ${investors.length}\n` +
    `📈 Total Acct Profits: ${fmt(totalAP)}\n` +
    `🔴 Total Owed: ${fmt(totalOwed)} (${owingCount} investors)\n`
  );
}

// /delete John Doe
async function cmdDelete(chatId, args) {
  if (!args.length) return sendMessage(chatId, '❌ Usage: `/delete Name`\nExample: `/delete John Doe`');
  const name = args.join(' ');
  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);
  const { error } = await sb.from('investors').delete().eq('id', inv.id);
  if (error) return sendMessage(chatId, '❌ Error deleting investor: ' + error.message);
  sendMessage(chatId, `🗑️ *${inv.fname} ${inv.lname}* has been deleted.`);
}
// /zero F
async function cmdZero(chatId, args) {
  if (!args.length) return sendMessage(chatId, '❌ Usage: `/zero Account`\nExample: `/zero F`\nAccounts: ' + ACCTS.join(', '));
  const acct = args[0].toUpperCase();
  if (!ACCTS.includes(acct)) return sendMessage(chatId, `❌ Unknown account "${acct}". Valid: ${ACCTS.join(', ')}`);
  const { data: investors } = await sb.from('investors').select('*');
  if (!investors) return sendMessage(chatId, '❌ Could not load investors.');
  const list = investors.filter(inv => {
    const profits = inv.acct_profits || {};
    return !(acct in profits) || profits[acct] === null || profits[acct] === undefined;
  });
  if (!list.length) return sendMessage(chatId, `✅ All investors have a value set for ${acct}!`);
  const lines = list.map(inv => `• ${inv.fname} ${inv.lname} (${inv.state || '—'})`).join('\n');
  sendMessage(chatId, `📊 *${acct} not set* — ${list.length} investor${list.length!==1?'s':''}\n\n${lines}`);
}

// /unused John Doe
async function cmdUnused(chatId, args) {
  if (!args.length) return sendMessage(chatId, '❌ Usage: `/unused Name`\nExample: `/unused John Doe`');
  const name = args.join(' ');
  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);
  const profits = inv.acct_profits || {};
  const missing = getAccts(inv).filter(k => !(k in profits) || profits[k] === null || profits[k] === undefined);
  if (!missing.length) return sendMessage(chatId, `✅ *${inv.fname} ${inv.lname}* has all accounts set!`);
  sendMessage(chatId, `📋 *${inv.fname} ${inv.lname}* — unused accounts:\n\n${missing.map(k => `• ${k}`).join('\n')}`);
}

// /owed
async function cmdOwed(chatId) {
  const { data: investors } = await sb.from('investors').select('*');
  if (!investors) return sendMessage(chatId, '❌ Could not load investors.');
  const list = investors.filter(inv => calcOwed(inv) > 0).sort((a, b) => calcOwed(b) - calcOwed(a));
  if (!list.length) return sendMessage(chatId, '🎉 No one owes you money right now!');
  const lines = list.map(inv => `• *${inv.fname} ${inv.lname}* — ${fmt(calcOwed(inv))}`).join('\n');
  const total = list.reduce((a, inv) => a + calcOwed(inv), 0);
  sendMessage(chatId, `🔴 *Investors That Owe Us* (${list.length})\n\n${lines}\n\n*Total: ${fmt(total)}*`);
}
// /profitowed
async function cmdProfitOwed(chatId) {
  const { data: investors } = await sb.from('investors').select('*');
  if (!investors) return sendMessage(chatId, '❌ Could not load investors.');
  const list = investors.filter(inv => {
    const ap = calcAP(inv);
    const profitShare = ap * ((inv.share || 0) / 100);
    const paid = (inv.payments || []).reduce((a, p) => a + (p.dir === 'out' ? -Number(p.amount || 0) : Number(p.amount || 0)), 0);
    return (profitShare - paid) > 0;
  }).sort((a, b) => {
    const calc = inv => {
      const ap = calcAP(inv);
      const paid = (inv.payments || []).reduce((a, p) => a + (p.dir === 'out' ? -Number(p.amount || 0) : Number(p.amount || 0)), 0);
      return ap * ((inv.share || 0) / 100) - paid;
    };
    return calc(b) - calc(a);
  });
  if (!list.length) return sendMessage(chatId, '🎉 No profit-based balances outstanding!');
  const lines = list.map(inv => {
    const ap = calcAP(inv);
    const paid = (inv.payments || []).reduce((a, p) => a + (p.dir === 'out' ? -Number(p.amount || 0) : Number(p.amount || 0)), 0);
    const bal = ap * ((inv.share || 0) / 100) - paid;
    return `• *${inv.fname} ${inv.lname}* — ${fmt(bal)}`;
  }).join('\n');
  const total = list.reduce((a, inv) => {
    const ap = calcAP(inv);
    const paid = (inv.payments || []).reduce((s, p) => s + (p.dir === 'out' ? -Number(p.amount || 0) : Number(p.amount || 0)), 0);
    return a + (ap * ((inv.share || 0) / 100) - paid);
  }, 0);
  sendMessage(chatId, `💹 *Profit-Based Balances* (${list.length})\n_Excludes Sands capital_\n\n${lines}\n\n*Total: ${fmt(total)}*`);
}

async function cmdHelp(chatId) {
  sendMessage(chatId,
    `➕ /add FirstName LastName State% Funded Capital\n` +
    `_Example: /add John Doe NY 15 sands 10000_\n\n` +
    `📊 /profit Name Account Amount\n` +
    `_Example: /profit John Doe F 5000_\n\n` +
    `📥 /paymentfrom Name Amount PaidTo\n` +
    `_Example: /paymentfrom John Doe 3000 Sands_\n\n` +
    `📤 /paymentto Name Amount\n` +
    `_We paid them (Sands implied)_\n` +
    `_Example: /paymentto John Doe 3000_\n\n` +
    `📋 /balance Name\n` +
    `_Example: /balance John Doe_\n\n` +
    `🗑️ /delete Name\n` +
    `_Example: /delete John Doe_\n\n` +
    `🔴 /owed — List all investors that owe you money\n\n` +
    `💹 /profitowed — Owed from profits only (excludes Sands capital)\n\n` +
    `🔍 /zero Account — List investors where account has no value set\n` +
    `_Example: /zero F_\n\n` +
    `❓ /unused Name — Show unset accounts for a specific investor\n` +
    `_Example: /unused John Doe_\n\n` +
    `📈 /stats — Fund overview\n\n` +
    `Accounts: F, D, M, C, 3, Riv, E, FNTS, HARD\n` +
    `_NY: excludes 3 | NJ: includes B_`
  );
}

// ── Webhook ──
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const msg = req.body.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;

  // Optional: restrict to specific chat
  if (ALLOWED_CHAT_ID && String(chatId) !== String(ALLOWED_CHAT_ID)) {
    return sendMessage(chatId, '⛔ Unauthorized.');
  }

  const text = msg.text.trim();
  const parts = text.split(/\s+/);
  const cmd = parts[0].toLowerCase().split('@')[0];
  const args = parts.slice(1);

  if (cmd === '/add')     await cmdAdd(chatId, args);
  else if (cmd === '/profit')  await cmdProfit(chatId, args);
  else if (cmd === '/paymentfrom') await cmdPaymentFrom(chatId, args);
  else if (cmd === '/paymentto')   await cmdPaymentTo(chatId, args);
  else if (cmd === '/balance') await cmdBalance(chatId, args);
  else if (cmd === '/delete')  await cmdDelete(chatId, args);
  else if (cmd === '/owed')       await cmdOwed(chatId);
  else if (cmd === '/unused')    await cmdUnused(chatId, args);
  else if (cmd === '/profitowed') await cmdProfitOwed(chatId);
  else if (cmd === '/zero')    await cmdZero(chatId, args);
  else if (cmd === '/stats')   await cmdStats(chatId);
  else if (cmd === '/help')    await cmdHelp(chatId);
  else sendMessage(chatId, 'Unknown command. Type /help for all commands.');
});

app.get('/', (req, res) => res.send('Fund Manager Bot is running ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
