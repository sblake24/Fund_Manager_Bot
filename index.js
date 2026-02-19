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

function calcOwed(inv) {
  const ap = inv.acct_profits || {};
  let t = 0;
  for (const k of ACCTS) t += Number(ap[k] || 0);
  const paid = (inv.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
  let base = t * (inv.share / 100);
  if ((inv.funded || '').toLowerCase() === 'sands') {
    base += Number(inv.invested || 0) + Number(inv.capital || 0);
  }
  (inv.extra_funding || []).forEach(ex => { if (ex.by === 'sands') base += Number(ex.amt || 0); });
  return base - paid;
}

function calcAP(inv) {
  const ap = inv.acct_profits || {};
  return ACCTS.reduce((a, k) => a + Number(ap[k] || 0), 0);
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

// /payment John Doe 3000 Sands
async function cmdPayment(chatId, args) {
  if (args.length < 3) {
    return sendMessage(chatId, '❌ Usage: `/payment Name Amount PaidTo`\nExample: `/payment John Doe 3000 Sands`');
  }
  const paidTo = args[args.length - 1];
  const amount = parseFloat(args[args.length - 2]) || 0;
  const name = args.slice(0, args.length - 2).join(' ');

  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);

  const payments = inv.payments || [];
  if (payments.length >= 5) return sendMessage(chatId, '❌ Max 5 payments per investor already reached.');
  payments.push({ amount, to: paidTo });

  const { error } = await sb.from('investors').update({ payments }).eq('id', inv.id);
  if (error) return sendMessage(chatId, '❌ Error recording payment: ' + error.message);

  const newOwed = calcOwed({ ...inv, payments });
  const owedLabel = newOwed < 0 ? `🟢 We owe them: ${fmt(Math.abs(newOwed))}` : `🔴 Still owed: ${fmt(newOwed)}`;
  sendMessage(chatId, `✅ Payment recorded for *${inv.fname} ${inv.lname}*\n💸 ${fmt(amount)} → ${paidTo}\n${owedLabel}`);
}

// /balance John Doe
async function cmdBalance(chatId, args) {
  if (!args.length) return sendMessage(chatId, '❌ Usage: `/balance Name`\nExample: `/balance John Doe`');
  const name = args.join(' ');
  const inv = await findInvestor(name);
  if (!inv) return sendMessage(chatId, `❌ Investor "${name}" not found.`);

  const ap = calcAP(inv);
  const owed = calcOwed(inv);
  const paid = (inv.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
  const owedLabel = owed < 0 ? `🟢 We owe them: ${fmt(Math.abs(owed))}` : `🔴 Owed: ${fmt(owed)}`;

  sendMessage(chatId,
    `📋 *${inv.fname} ${inv.lname}*\n` +
    `funded: "${inv.funded}" | share: ${inv.share}%\n` +
    `capital: ${inv.capital} | invested: ${inv.invested}\n` +
    `acct profit: ${ap} | paid: ${paid}\n` +
    `payments raw: ${JSON.stringify(inv.payments)}\n` +
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

// /help
async function cmdHelp(chatId) {
  sendMessage(chatId,
    `*Fund Manager Bot Commands*\n\n` +
    `➕ /add FirstName LastName State% Funded Capital\n` +
    `_Example: /add John Doe NY 15 sands 10000_\n\n` +
    `📊 /profit Name Account Amount\n` +
    `_Example: /profit John Doe F 5000_\n\n` +
    `💸 /payment Name Amount PaidTo\n` +
    `_Example: /payment John Doe 3000 Sands_\n\n` +
    `📋 /balance Name\n` +
    `_Example: /balance John Doe_\n\n` +
    `📈 /stats — Fund overview\n\n` +
    `Accounts: F, D, M, C, 3, Riv, E, FNTS, HARD`
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
  const cmd = parts[0].toLowerCase().replace('@', '').split('@')[0];
  const args = parts.slice(1);

  if (cmd === '/add')     await cmdAdd(chatId, args);
  else if (cmd === '/profit')  await cmdProfit(chatId, args);
  else if (cmd === '/payment') await cmdPayment(chatId, args);
  else if (cmd === '/balance') await cmdBalance(chatId, args);
  else if (cmd === '/stats')   await cmdStats(chatId);
  else if (cmd === '/help')    await cmdHelp(chatId);
  else sendMessage(chatId, 'Unknown command. Type /help for all commands.');
});

app.get('/', (req, res) => res.send('Fund Manager Bot is running ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
