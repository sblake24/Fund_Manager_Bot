<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fund Manager Pro</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,600;1,300&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root {
  --bg:#0a0b0e; --surface:#111318; --surface2:#1a1d24; --border:#2a2d36;
  --accent:#c8f04a; --accent2:#4af0c8; --red:#f04a6e;
  --text:#e8eaf0; --muted:#6b7080; --mono:'DM Mono',monospace; --serif:'Fraunces',serif;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:var(--mono);font-size:13px;min-height:100vh;}

/* ── Password Screen ── */
#pw-screen{position:fixed;inset:0;background:var(--bg);z-index:9999;display:flex;align-items:center;justify-content:center;}
.pw-box{text-align:center;width:320px;}
.pw-logo{font-family:var(--serif);font-size:34px;font-weight:600;margin-bottom:6px;}
.pw-logo span{color:var(--accent);}
.pw-sub{color:var(--muted);font-size:12px;margin-bottom:28px;}
#pw-input{display:block;width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:12px;font-family:var(--mono);font-size:15px;border-radius:4px;outline:none;text-align:center;margin-bottom:10px;}
#pw-input:focus{border-color:var(--accent);}
#pw-btn{display:block;width:100%;background:var(--accent);color:#0a0b0e;border:none;padding:11px;font-family:var(--mono);font-size:13px;font-weight:500;cursor:pointer;border-radius:4px;}
#pw-btn:hover{opacity:.88;}
#pw-error{color:var(--red);font-size:11px;margin-top:8px;min-height:16px;}

/* ── App Shell ── */
#app{display:none;}
.shell{display:grid;grid-template-columns:220px 1fr;grid-template-rows:56px 1fr;min-height:100vh;}
.topbar{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;padding:0 28px;border-bottom:1px solid var(--border);background:var(--surface);}
.logo{font-family:var(--serif);font-size:22px;font-weight:600;}
.logo span{color:var(--accent);}
.topbar-right{display:flex;align-items:center;gap:16px;color:var(--muted);font-size:12px;}
.live-dot{width:8px;height:8px;background:var(--accent);border-radius:50%;animation:pulse 2s infinite;}
.live-dot.offline{background:var(--red);}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.sidebar{background:var(--surface);border-right:1px solid var(--border);padding:20px 0;overflow-y:auto;}
.nav-section{padding:16px 20px 6px;font-size:10px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;color:var(--muted);transition:all .15s;font-size:12px;letter-spacing:.5px;text-transform:uppercase;border-left:2px solid transparent;}
.nav-item:hover{color:var(--text);background:var(--surface2);}
.nav-item.active{color:var(--text);background:var(--surface2);border-left-color:var(--accent);padding-left:18px;}
.nav-item svg{width:16px;height:16px;flex-shrink:0;}
.main{padding:28px;overflow-y:auto;}
.view{display:none;}
.view.active{display:block;animation:fadeIn .2s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}
.page-title{font-family:var(--serif);font-size:26px;font-weight:300;}
.page-sub{color:var(--muted);font-size:11px;margin-top:4px;}
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;}
.stat-card{background:var(--surface);border:1px solid var(--border);padding:18px 20px;border-radius:4px;}
.stat-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
.stat-val{font-family:var(--serif);font-size:26px;font-weight:600;}
.stat-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.green{color:var(--accent);}.red{color:var(--red);}
.card{background:var(--surface);border:1px solid var(--border);border-radius:4px;overflow:hidden;margin-bottom:20px;}
.card-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border);}
.card-title{font-family:var(--serif);font-size:16px;font-weight:300;}
.btn{background:var(--accent);color:#0a0b0e;border:none;padding:8px 16px;font-family:var(--mono);font-size:12px;font-weight:500;cursor:pointer;border-radius:3px;transition:opacity .15s;}
.btn:hover{opacity:.85;}.btn:disabled{opacity:.4;cursor:not-allowed;}
.btn-ghost{background:transparent;color:var(--accent);border:1px solid var(--accent);}
.btn-ghost:hover{background:var(--accent);color:#0a0b0e;}
.btn-sm{padding:5px 10px;font-size:11px;}
.btn-red{background:var(--red);color:#fff;}
table{width:100%;border-collapse:collapse;}
th{text-align:left;padding:10px 20px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);font-weight:400;}
td{padding:12px 20px;border-bottom:1px solid #1e212a;font-size:12px;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:var(--surface2);}
.tag{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;}
.tag-green{background:#c8f04a18;color:var(--accent);}
.tag-red{background:#f04a6e18;color:var(--red);}
.tag-blue{background:#4af0c818;color:var(--accent2);}
.inv-card{background:var(--surface);border:1px solid var(--border);border-radius:4px;margin-bottom:10px;}
.inv-card-top{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;cursor:pointer;user-select:none;}
.inv-card-top:hover{background:var(--surface2);}
.inv-name{font-family:var(--serif);font-size:16px;font-weight:300;}
.inv-card-body{padding:20px;border-top:1px solid var(--border);background:var(--surface2);}
.inv-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
.meta-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
.acct-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.acct-box{background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:12px;}
.acct-name{font-size:13px;font-weight:500;color:var(--accent);margin-bottom:8px;}
.acct-input-wrap{display:flex;align-items:center;gap:4px;}
.dollar-sign{color:var(--muted);font-size:12px;}
.acct-input{background:transparent;border:none;border-bottom:1px solid var(--border);color:var(--text);padding:3px 0;font-family:var(--mono);font-size:13px;width:100%;outline:none;}
.acct-input:focus{border-bottom-color:var(--accent);}
.search-wrap{margin-bottom:14px;}
.search-wrap input{width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:9px 14px;font-family:var(--mono);font-size:13px;border-radius:3px;outline:none;}
.search-wrap input:focus{border-color:var(--accent);}
.progress{background:var(--surface2);height:4px;border-radius:2px;margin-top:6px;}
.progress-fill{height:100%;border-radius:2px;background:var(--accent);}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;align-items:center;justify-content:center;}
.modal-bg.open{display:flex;}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:6px;width:580px;max-width:95vw;max-height:90vh;overflow-y:auto;padding:28px;}
.modal h2{font-family:var(--serif);font-size:20px;font-weight:300;margin-bottom:20px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);}
input[type=text],input[type=number],input[type=date],select{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:9px 12px;font-family:var(--mono);font-size:13px;border-radius:3px;outline:none;width:100%;}
input:focus,select:focus{border-color:var(--accent);}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px;}
.payment-row{display:grid;grid-template-columns:1fr 1fr 1fr 36px;gap:8px;align-items:end;margin-bottom:8px;}
.add-payment-btn{background:transparent;border:1px dashed var(--border);color:var(--muted);padding:8px;font-family:var(--mono);font-size:11px;cursor:pointer;border-radius:3px;width:100%;margin-top:4px;}
.add-payment-btn:hover{border-color:var(--accent);color:var(--accent);}
.toggle-wrap{display:flex;align-items:center;background:var(--surface2);border:1px solid var(--border);border-radius:4px;overflow:hidden;height:38px;}
.toggle-opt{flex:1;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;color:var(--muted);transition:all .15s;padding:0 12px;}
.toggle-opt.active{background:var(--accent);color:#0a0b0e;font-weight:500;}

.loading-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;align-items:center;justify-content:center;flex-direction:column;gap:12px;}
.loading-overlay.show{display:flex;}
.spinner{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--accent);color:var(--text);padding:12px 20px;border-radius:4px;font-size:12px;z-index:300;opacity:0;transition:opacity .3s;pointer-events:none;}
.toast.show{opacity:1;}
::-webkit-scrollbar{width:6px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
@media(max-width:700px){
  .shell{grid-template-columns:1fr;}.sidebar{display:none;}
  .stats-grid{grid-template-columns:1fr 1fr;}.inv-meta{grid-template-columns:1fr 1fr;}
  .acct-grid{grid-template-columns:repeat(2,1fr);}.form-row{grid-template-columns:1fr;}
}
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:8px;background:none;border:none;}
.hamburger span{display:block;width:22px;height:2px;background:var(--text);border-radius:2px;transition:all .2s;}
@media(max-width:700px){
  .hamburger{display:flex;}
}
.mobile-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;}
.mobile-overlay.open{display:block;}
.mobile-sidebar{position:fixed;top:0;left:-240px;width:240px;height:100%;background:var(--surface);border-right:1px solid var(--border);z-index:501;transition:left .25s ease;overflow-y:auto;padding:20px 0;}
.mobile-sidebar.open{left:0;}
.mobile-sidebar-close{display:flex;align-items:center;justify-content:space-between;padding:12px 20px 20px;border-bottom:1px solid var(--border);margin-bottom:8px;}
.mobile-sidebar-close .logo{font-family:var(--serif);font-size:20px;font-weight:600;}
.mobile-sidebar-close .logo span{color:var(--accent);}
.close-btn{background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;line-height:1;}
</style>
</head>
<body>

<!-- PASSWORD SCREEN -->
<div id="pw-screen">
  <div class="pw-box">
    <div class="pw-logo">Fund<span>Manager</span></div>
    <div class="pw-sub">Enter password to continue</div>
    <input id="pw-input" type="password" placeholder="Password" autocomplete="off">
    <button id="pw-btn">Enter</button>
    <div id="pw-error"></div>
  </div>
</div>

<!-- APP -->
<div id="app">
  <!-- Mobile sidebar -->
  <div class="mobile-overlay" id="mobile-overlay" onclick="closeMobileSidebar()"></div>
  <nav class="mobile-sidebar" id="mobile-sidebar">
    <div class="mobile-sidebar-close">
      <div class="logo">Fund<span>Manager</span></div>
      <button class="close-btn" onclick="closeMobileSidebar()">✕</button>
    </div>
    <div class="nav-section">Overview</div>
    <div class="nav-item" onclick="showView('dashboard',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
      Dashboard
    </div>
    <div class="nav-section">Investors</div>
    <div class="nav-item" onclick="showView('investors',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      Investors
    </div>
    <div class="nav-section">Finance</div>
    <div class="nav-item" onclick="showView('overview',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      Package Overview
    </div>
    <div class="nav-item" onclick="showView('owed',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      Packages That Owe
    </div>
    <div class="nav-section">Clickers</div>
    <div class="nav-item" onclick="showView('clicker-sands',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      Sands
    </div>
    <div class="nav-item" onclick="showView('clicker-jorge',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      Jorge
    </div>
    <div class="nav-item" onclick="showView('clicker-sebas',this);closeMobileSidebar()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      Sebas
    </div>
  </nav>
  <div class="loading-overlay" id="loading-overlay">
    <div class="spinner"></div>
    <div style="color:var(--muted);font-size:12px">Loading…</div>
  </div>
  <div class="toast" id="toast"></div>

  <div class="shell">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="hamburger" onclick="openMobileSidebar()"><span></span><span></span><span></span></button>
        <div class="logo">Fund<span>Manager</span></div>
      </div>
      <div class="topbar-right">
        <div class="live-dot" id="conn-dot"></div>
        <span id="conn-status">Connecting…</span>
        <span id="clock"></span>
      </div>
    </div>

    <nav class="sidebar">
      <div class="nav-section">Overview</div>
      <div class="nav-item active" onclick="showView('dashboard',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Dashboard
      </div>
      <div class="nav-section">Investors</div>
      <div class="nav-item" onclick="showView('investors',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Investors
      </div>
      <div class="nav-section">Finance</div>
      <div class="nav-item" onclick="showView('overview',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Package Overview
      </div>
      <div class="nav-item" onclick="showView('owed',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Packages That Owe
      </div>
      <div class="nav-section">Clickers</div>
      <div class="nav-item" onclick="showView('clicker-sands',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        Sands
      </div>
      <div class="nav-item" onclick="showView('clicker-jorge',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        Jorge
      </div>
      <div class="nav-item" onclick="showView('clicker-sebas',this)">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        Sebas
      </div>
    </nav>

    <main class="main">

      <!-- DASHBOARD -->
      <div class="view active" id="view-dashboard">
        <div class="page-header"><div><div class="page-title">Overview</div><div class="page-sub">Fund performance at a glance</div></div></div>
        <div class="stats-grid" id="dash-stats"></div>
        <div class="card">
          <div class="card-header"><span class="card-title">Top Investors</span><button class="btn btn-ghost btn-sm" onclick="showView('investors',document.querySelectorAll('.nav-item')[1])">View All</button></div>
          <table><thead><tr><th>Name</th><th>Account Profit</th><th>% Our Way</th><th>Est. Return</th></tr></thead><tbody id="dash-top-body"></tbody></table>
        </div>
      </div>

      <!-- INVESTORS -->
      <div class="view" id="view-investors">
        <div class="page-header">
          <div><div class="page-title">Investors</div><div class="page-sub" id="inv-count-label">0 investors</div></div>
          <button class="btn" onclick="openAddInvestor()">+ Add Investor</button>
        </div>
        <div class="search-wrap"><input type="text" id="inv-search" placeholder="Search by name or state…" oninput="renderInvestors()"></div>
        <div id="inv-cards"></div>
      </div>

      <!-- PACKAGE OVERVIEW -->
      <div class="view" id="view-overview">
        <div class="page-header">
          <div><div class="page-title">Package Overview</div><div class="page-sub" id="overview-sub">All investors</div></div>
        </div>
        <div id="overview-cards"></div>
      </div>

      <!-- PACKAGES THAT OWE -->
      <div class="view" id="view-owed">
        <div class="page-header">
          <div><div class="page-title">Packages That Owe</div><div class="page-sub" id="owed-sub">Investors with outstanding balances</div></div>
        </div>
        <div id="owed-cards"></div>
      </div>

      <!-- CLICKER: SANDS -->
      <div class="view" id="view-clicker-sands">
        <div class="page-header"><div><div class="page-title">Sands</div><div class="page-sub">Clicker stats</div></div></div>
        <div id="clicker-sands-content"></div>
      </div>

      <!-- CLICKER: JORGE -->
      <div class="view" id="view-clicker-jorge">
        <div class="page-header"><div><div class="page-title">Jorge</div><div class="page-sub">Clicker stats</div></div></div>
        <div id="clicker-jorge-content"></div>
      </div>

      <!-- CLICKER: SEBAS -->
      <div class="view" id="view-clicker-sebas">
        <div class="page-header"><div><div class="page-title">Sebas</div><div class="page-sub">Clicker stats</div></div></div>
        <div id="clicker-sebas-content"></div>
      </div>

    </main>
  </div>
</div>

<!-- MODAL: Add Investor -->
<div class="modal-bg" id="modal-add-investor">
  <div class="modal">
    <h2>Add Investor</h2>
    <div class="form-row">
      <div class="form-group"><label>First Name</label><input type="text" id="a-fname" placeholder="John"></div>
      <div class="form-group"><label>Last Name</label><input type="text" id="a-lname" placeholder="Doe"></div>
    </div>
    <div class="form-group"><label>State</label><input type="text" id="a-state" placeholder="e.g. California"></div>
    <div class="form-row">
      <div class="form-group"><label>Capital Contributed ($)</label><input type="number" id="a-capital" placeholder="10000"></div>
      <div class="form-group"><label>Amount Invested ($)</label><input type="number" id="a-invested" placeholder="10000"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>% Our Way</label><input type="number" id="a-share" placeholder="5"></div>
      <div class="form-group"><label>Money Owed ($)</label><input type="number" id="a-owed" placeholder="0"></div>
    </div>
    <div class="form-group"><label>Who Funded</label><div class="toggle-wrap"><div class="toggle-opt active" id="a-funded-client" onclick="setFunded('a','client')">Client</div><div class="toggle-opt" id="a-funded-sands" onclick="setFunded('a','sands')">Sands</div></div></div>
    <div class="form-group"><label>Notes</label><input type="text" id="a-notes" placeholder="Optional"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('add-investor')">Cancel</button>
      <button class="btn" id="btn-add-inv" onclick="addInvestor()">Add Investor</button>
    </div>
  </div>
</div>

<!-- MODAL: Edit Investor -->
<div class="modal-bg" id="modal-edit-investor">
  <div class="modal">
    <h2>Edit Investor</h2>
    <div class="form-row">
      <div class="form-group"><label>First Name</label><input type="text" id="e-fname"></div>
      <div class="form-group"><label>Last Name</label><input type="text" id="e-lname"></div>
    </div>
    <div class="form-group"><label>State</label><input type="text" id="e-state"></div>
    <div class="form-group"><label>Capital Contributed ($)</label><input type="number" id="e-capital"></div>
    <div class="form-row">
      <div class="form-group"><label>% Our Way</label><input type="number" id="e-share"></div>
      <div class="form-group"><label>Who Funded</label><div class="toggle-wrap"><div class="toggle-opt active" id="e-funded-client" onclick="setFunded('e','client')">Client</div><div class="toggle-opt" id="e-funded-sands" onclick="setFunded('e','sands')">Sands</div></div></div>
    </div>
    <div class="form-group"><label>Notes</label><input type="text" id="e-notes"></div>
    <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:12px">Additional Money Funded</div>
      <div class="form-row" style="margin-bottom:8px">
        <div class="form-group" style="margin:0"><label>Slot 1 — Amount ($)</label><input type="number" id="e-extra1-amt" placeholder="0"></div>
        <div class="form-group" style="margin:0"><label>Slot 1 — Funded By</label><div class="toggle-wrap"><div class="toggle-opt active" id="e-extra1-client" onclick="setExtraFunded(1,'client')">Client</div><div class="toggle-opt" id="e-extra1-sands" onclick="setExtraFunded(1,'sands')">Sands</div></div></div>
      </div>
      <div class="form-row">
        <div class="form-group" style="margin:0"><label>Slot 2 — Amount ($)</label><input type="number" id="e-extra2-amt" placeholder="0"></div>
        <div class="form-group" style="margin:0"><label>Slot 2 — Funded By</label><div class="toggle-wrap"><div class="toggle-opt active" id="e-extra2-client" onclick="setExtraFunded(2,'client')">Client</div><div class="toggle-opt" id="e-extra2-sands" onclick="setExtraFunded(2,'sands')">Sands</div></div></div>
      </div>
    </div>
    <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:12px">Payment History (up to 5)</div>
      <div id="payments-list"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('edit-investor')">Cancel</button>
      <button class="btn" id="btn-save-inv" onclick="saveInvestorEdit()">Save Changes</button>
    </div>
  </div>
</div>

<script>
// ── Supabase ──
var SURL = 'https://naddbakqgtpucipgdojn.supabase.co';
var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZGRiYWtxZ3RwdWNpcGdkb2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Njg0MDksImV4cCI6MjA4NzA0NDQwOX0.z93lH_WpZV4_WLYefUShw0khykHCyOqj2oM2vToGE8w';
var sb = supabase.createClient(SURL, SKEY);

var ACCTS = ['F','D','M','C','3','Riv','E','FNTS','HARD'];
var investors = [], txns = [], payouts = [], clickerAssignments = [];
var editingId = null;

function fmt(n){ return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); }
function invName(id){ var i=investors.find(function(x){return x.id===id;}); return i?i.fname+' '+i.lname:'—'; }
function todayStr(){ return new Date().toISOString().split('T')[0]; }
function loading(show){ document.getElementById('loading-overlay').classList.toggle('show',show); }
function toast(msg){ var el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(function(){el.classList.remove('show');},2500); }
function setConnected(ok){ document.getElementById('conn-dot').className='live-dot'+(ok?'':' offline'); document.getElementById('conn-status').textContent=ok?'Live':'Offline'; }
function calcOwed(inv){
  var ap=inv.acctProfits||{},t=0;
  for(var k=0;k<ACCTS.length;k++){t+=Number(ap[ACCTS[k]]||0);}
  var paid=(inv.payments||[]).reduce(function(a,p){
    return a + (p.dir==='out' ? -Number(p.amount||0) : Number(p.amount||0));
  },0);
  var base=t*(inv.share/100);
  if((inv.funded||'').toLowerCase()==='sands') base+=Number(inv.invested||0)+Number(inv.capital||0);
  (inv.extraFunding||[]).forEach(function(ex){ if(ex.by==='sands') base+=Number(ex.amt||0); });
  return base-paid;
}
function calcAP(inv){ var ap=inv.acctProfits||{},t=0; for(var k=0;k<ACCTS.length;k++){t+=Number(ap[ACCTS[k]]||0);} return t; }

// ── Load ──
async function loadAll(){
  loading(true);
  try {
    var r1=await sb.from('investors').select('*').order('id');
    var r2=await sb.from('transactions').select('*').order('date',{ascending:false});
    var r3=await sb.from('payouts').select('*').order('date',{ascending:false});
    var r4=await sb.from('clicker_assignments').select('*');
    investors=((r1.data)||[]).map(function(r){ r.acctProfits=r.acct_profits||{}; r.payments=r.payments||[]; r.extraFunding=r.extra_funding||[{amt:0,by:'client'},{amt:0,by:'client'}]; return r; });
    txns=(r2.data)||[]; payouts=(r3.data)||[]; clickerAssignments=(r4.data)||[];
    setConnected(true);
    renderDashboard();
  } catch(e){ setConnected(false); toast('Could not connect to database.'); }
  loading(false);
}

// ── Navigation ──
function showView(name,el){
  document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  document.getElementById('view-'+name).classList.add('active');
  if(el) el.classList.add('active');
  if(name==='dashboard') renderDashboard();
  if(name==='investors') renderInvestors();
  if(name==='overview')  renderOverview();
  if(name==='owed')      renderOwed();
  if(name==='clicker-sands') renderClicker('sands');
  if(name==='clicker-jorge') renderClicker('jorge');
  if(name==='clicker-sebas') renderClicker('sebas');
}

// ── Dashboard ──
function renderDashboard(){
  var now=new Date(), ym=now.toISOString().slice(0,7), yr=now.getFullYear().toString();
  var totalAP=investors.reduce(function(a,inv){return a+calcAP(inv);},0);
  var netMonth=txns.filter(function(t){return t.date&&t.date.startsWith(ym);}).reduce(function(a,t){
    if(t.type==='profit'||t.type==='deposit') return a+Number(t.amount);
    if(t.type==='withdrawal'||t.type==='fee') return a-Number(t.amount);
    return a;
  },0);
  var netYear=txns.filter(function(t){return t.date&&t.date.startsWith(yr);}).reduce(function(a,t){
    if(t.type==='profit'||t.type==='deposit') return a+Number(t.amount);
    if(t.type==='withdrawal'||t.type==='fee') return a-Number(t.amount);
    return a;
  },0)+totalAP;
  var totalOwed=investors.reduce(function(a,b){return a+Math.max(0,calcOwed(b));},0);
  var totalProfits=txns.filter(function(t){return t.type==='profit';}).reduce(function(a,b){return a+Number(b.amount);},0);
  function pStats(name){ var inv=investors.find(function(i){return (i.fname+' '+i.lname).toLowerCase().indexOf(name.toLowerCase())>=0;}); if(!inv) return {rev:0,pct:0}; return {rev:totalProfits*(inv.share/100),pct:inv.share}; }
  var sebas=pStats('sebas'),jorge=pStats('jorge'),sands=pStats('sands');
  document.getElementById('dash-stats').innerHTML=
    '<div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-val '+(netYear>=0?'green':'red')+'">'+fmt(netYear)+'</div><div class="stat-sub">All time</div></div>'+
    '<div class="stat-card"><div class="stat-label">Money Owed</div><div class="stat-val red">'+fmt(totalOwed)+'</div><div class="stat-sub">Across '+investors.filter(function(i){return calcOwed(i)>0;}).length+' investor(s)</div></div>';
  var top=[].concat(investors).sort(function(a,b){return calcAP(b)-calcAP(a);}).slice(0,8);
  document.getElementById('dash-top-body').innerHTML=top.map(function(inv){
    return '<tr><td><strong>'+inv.fname+' '+inv.lname+'</strong></td><td class="green">'+fmt(calcAP(inv))+'</td>'+
      '<td>'+inv.share+'%<div class="progress"><div class="progress-fill" style="width:'+Math.min(inv.share,100)+'%"></div></div></td>'+
      '<td class="green">'+fmt(calcAP(inv)*(inv.share/100))+'</td></tr>';
  }).join('');
}

// ── Investors ──
function renderInvestors(){
  var q=(document.getElementById('inv-search')||{}).value||'';
  var list=investors.filter(function(i){return (i.fname+' '+i.lname+(i.state||'')).toLowerCase().indexOf(q.toLowerCase())>=0;});
  document.getElementById('inv-count-label').textContent='Managing '+investors.length+' investor'+(investors.length!==1?'s':'');
  if(!list.length){document.getElementById('inv-cards').innerHTML='<div style="color:var(--muted);padding:20px;text-align:center">No investors found.</div>';return;}
  var html='';
  for(var i=0;i<list.length;i++){
    var inv=list[i];
    var ap=inv.acctProfits||{};
    var totalAP=calcAP(inv);
    var totalPaid=(inv.payments||[]).reduce(function(a,p){return a+Number(p.amount||0);},0);
    var owed=calcOwed(inv);
    var acctBoxes='';
    for(var j=0;j<ACCTS.length;j++){
      var ac=ACCTS[j];
      acctBoxes+='<div class="acct-box"><div class="acct-name">'+ac+'</div><div class="acct-input-wrap"><span class="dollar-sign">$</span><input class="acct-input" type="number" placeholder="0" value="'+(ap[ac]||'')+'" onchange="saveAcctProfit('+inv.id+',\''+ac+'\',this.value)"></div></div>';
    }
    var pmtHTML='';
    if(inv.payments&&inv.payments.length){
      pmtHTML='<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px">Payments Made</div>'+
        inv.payments.map(function(p){
          var isOut=p.dir==='out';
          return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e212a">'+
            '<span style="color:var(--muted);font-size:12px">'+(isOut?'We paid:':'Paid to:')+' <strong style="color:var(--text)">'+(p.to||'—')+'</strong></span>'+
            '<span class="'+(isOut?'red':'green')+'" style="font-family:var(--serif);font-size:15px">'+(isOut?'-':'')+fmt(p.amount)+'</span>'+
          '</div>';}).join('')+'</div>';
    }
    html+='<div class="inv-card">'+
      '<div class="inv-card-top" onclick="toggleCard('+inv.id+')">'+
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="inv-name">'+inv.fname+' '+inv.lname+'</span><span class="tag tag-blue">'+inv.share+'%</span>'+(inv.state?'<span style="color:var(--muted);font-size:11px">'+inv.state+'</span>':'')+
        '</div><div style="display:flex;align-items:center;gap:16px"><span style="font-size:11px;color:var(--muted)">Acct Profit: <span class="green" id="ap-total-'+inv.id+'">'+fmt(totalAP)+'</span></span><span style="color:var(--muted);font-size:16px" id="arrow-'+inv.id+'">▾</span></div>'+
      '</div>'+
      '<div class="inv-card-body" id="card-body-'+inv.id+'" style="display:none">'+
        '<div class="inv-meta">'+
          '<div><div class="meta-label">Amount Invested</div><div>'+fmt(inv.invested||inv.capital)+'</div></div>'+
          '<div><div class="meta-label">Who Funded</div><div>'+(inv.funded?(inv.funded.charAt(0).toUpperCase()+inv.funded.slice(1)):'—')+'</div></div>'+
          '<div><div class="meta-label">Money Owed</div><div class="'+(owed<0?'green':'red')+'" id="owed-'+inv.id+'">'+fmt(Math.abs(owed))+(owed<0?' (we owe them)':'')+'</div><div style="font-size:10px;color:var(--muted)">'+fmt(totalAP)+' × '+inv.share+'%'+(inv.funded==='sands'?' + '+fmt(inv.invested||0)+' invested + '+fmt(inv.capital||0)+' capital':'')+' − '+fmt(totalPaid)+' paid</div></div>'+
          '<div><div class="meta-label">Notes</div><div style="color:var(--muted)">'+(inv.notes||'—')+'</div></div>'+
          ((inv.extraFunding||[]).filter(function(ex){return ex.amt>0;}).length ?
            (inv.extraFunding||[]).filter(function(ex){return ex.amt>0;}).map(function(ex,i){
              return '<div><div class="meta-label">Extra Funding '+(i+1)+'</div><div>'+fmt(ex.amt)+' <span class="tag '+(ex.by==='sands'?'tag-red':'tag-green')+'">'+(ex.by==='sands'?'Sands':'Client')+'</span></div></div>';
            }).join('') : '')+
        '</div>'+
        '<div style="margin-bottom:10px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Account Profits</div>'+
        '<div class="acct-grid">'+acctBoxes+'</div>'+
        pmtHTML+
        '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">'+
          '<button class="btn btn-ghost btn-sm" onclick="openEditInvestor('+inv.id+')">Edit Info</button>'+
          '<button class="btn btn-red btn-sm" onclick="removeInvestor('+inv.id+')">Remove</button>'+
        '</div>'+
      '</div></div>';
  }
  document.getElementById('inv-cards').innerHTML=html;
}

function toggleCard(id){
  var body=document.getElementById('card-body-'+id);
  var arrow=document.getElementById('arrow-'+id);
  if(!body) return;
  var open=body.style.display==='none';
  body.style.display=open?'block':'none';
  if(arrow) arrow.textContent=open?'▴':'▾';
}

async function saveAcctProfit(invId,acct,val){
  var inv=investors.find(function(i){return i.id===invId;});
  if(!inv) return;
  if(!inv.acctProfits) inv.acctProfits={};
  inv.acctProfits[acct]=parseFloat(val)||0;
  var total=calcAP(inv);
  var el=document.getElementById('ap-total-'+invId);
  if(el) el.textContent=fmt(total);
  var owedEl=document.getElementById('owed-'+invId);
  if(owedEl){
    var o=calcOwed(inv);
    owedEl.textContent=fmt(Math.abs(o))+(o<0?' (we owe them)':'');
    owedEl.className=o<0?'green':'red';
  }
  await sb.from('investors').update({acct_profits:inv.acctProfits}).eq('id',invId);
}

function setExtraFunded(slot, val){
  document.getElementById('e-extra'+slot+'-client').className='toggle-opt'+(val==='client'?' active':'');
  document.getElementById('e-extra'+slot+'-sands').className='toggle-opt'+(val==='sands'?' active':'');
}
function getExtraFunded(slot){
  return document.getElementById('e-extra'+slot+'-sands').classList.contains('active')?'sands':'client';
}
function setFunded(prefix, val){
  document.getElementById(prefix+'-funded-client').className='toggle-opt'+(val==='client'?' active':'');
  document.getElementById(prefix+'-funded-sands').className='toggle-opt'+(val==='sands'?' active':'');
}
function getFunded(prefix){
  return document.getElementById(prefix+'-funded-sands').classList.contains('active')?'sands':'client';
}

function openAddInvestor(){ document.getElementById('modal-add-investor').classList.add('open'); }

async function addInvestor(){
  var fname=document.getElementById('a-fname').value.trim();
  var lname=document.getElementById('a-lname').value.trim();
  if(!fname||!lname){alert('First and last name required.');return;}
  var btn=document.getElementById('btn-add-inv'); btn.disabled=true; btn.textContent='Saving…';
  var row={fname:fname,lname:lname,state:document.getElementById('a-state').value.trim(),
    capital:parseFloat(document.getElementById('a-capital').value)||0,
    invested:parseFloat(document.getElementById('a-invested').value)||0,
    share:parseFloat(document.getElementById('a-share').value)||0,
    owed:parseFloat(document.getElementById('a-owed').value)||0,
    funded:getFunded('a').toLowerCase(),
    notes:document.getElementById('a-notes').value.trim(),
    acct_profits:{},payments:[]};
  var res=await sb.from('investors').insert(row).select().single();
  btn.disabled=false; btn.textContent='Add Investor';
  if(res.error){toast('Error saving.');return;}
  res.data.acctProfits={}; res.data.payments=[];
  investors.push(res.data);
  closeModal('add-investor');
  ['a-fname','a-lname','a-state','a-capital','a-invested','a-share','a-owed','a-notes'].forEach(function(id){document.getElementById(id).value='';});
  setFunded('a','client');
  renderInvestors(); toast('Investor added!');
}

function openEditInvestor(id){
  var inv=investors.find(function(i){return i.id===id;});
  if(!inv) return;
  editingId=id;
  document.getElementById('e-fname').value=inv.fname||'';
  document.getElementById('e-lname').value=inv.lname||'';
  document.getElementById('e-state').value=inv.state||'';
  document.getElementById('e-capital').value=inv.capital||'';
  document.getElementById('e-share').value=inv.share||'';
  setFunded('e', (inv.funded||'').toLowerCase()==='sands'?'sands':'client');
  var ex = inv.extraFunding || [{amt:0,by:'client'},{amt:0,by:'client'}];
  document.getElementById('e-extra1-amt').value = ex[0]?ex[0].amt||'':'';
  setExtraFunded(1, ex[0]&&ex[0].by==='sands'?'sands':'client');
  document.getElementById('e-extra2-amt').value = ex[1]?ex[1].amt||'':'';
  setExtraFunded(2, ex[1]&&ex[1].by==='sands'?'sands':'client');
  document.getElementById('e-notes').value=inv.notes||'';
  renderPaymentRows(inv.payments||[]);
  document.getElementById('modal-edit-investor').classList.add('open');
}

function renderPaymentRows(payments){
  var html='';
  for(var i=0;i<payments.length;i++){html+=paymentRowHTML(i,payments[i]);}
  if(payments.length<5){html+='<button class="add-payment-btn" onclick="addPaymentRow()">+ Add Payment</button>';}
  document.getElementById('payments-list').innerHTML=html;
}
function paymentRowHTML(i,p){
  var dir=p.dir||'in';
  return '<div class="payment-row" id="prow-'+i+'">'+
    '<div class="form-group" style="margin:0"><label>Amount ($)</label><input type="number" id="p-amt-'+i+'" placeholder="500" value="'+(p.amount||'')+'"></div>'+
    '<div class="form-group" style="margin:0"><label>'+(dir==='in'?'Paid To':'Paid By')+'</label><input type="text" id="p-to-'+i+'" placeholder="e.g. John Doe" value="'+(p.to||'')+'"></div>'+
    '<div class="form-group" style="margin:0"><label>Direction</label>'+
      '<div class="toggle-wrap" style="height:38px">'+
        '<div class="toggle-opt'+(dir==='in'?' active':'')+'" id="p-dir-in-'+i+'" onclick="setPayDir('+i+',\'in\')">They Pay</div>'+
        '<div class="toggle-opt'+(dir==='out'?' active':'')+'" id="p-dir-out-'+i+'" onclick="setPayDir('+i+',\'out\')">We Pay</div>'+
      '</div></div>'+
    '<button class="remove-payment-btn" onclick="removePaymentRow('+i+')" style="margin-top:18px">✕</button></div>';
}
function setPayDir(i, dir){
  document.getElementById('p-dir-in-'+i).className='toggle-opt'+(dir==='in'?' active':'');
  document.getElementById('p-dir-out-'+i).className='toggle-opt'+(dir==='out'?' active':'');
  var label=document.querySelector('#prow-'+i+' .form-group:nth-child(2) label');
  if(label) label.textContent=dir==='in'?'Paid To':'Paid By';
}
function getPayDir(i){
  var el=document.getElementById('p-dir-out-'+i);
  return el&&el.classList.contains('active')?'out':'in';
}
function addPaymentRow(){
  var rows=document.querySelectorAll('.payment-row');
  if(rows.length>=5) return;
  var idx=rows.length;
  var div=document.createElement('div');
  div.innerHTML=paymentRowHTML(idx,{});
  var list=document.getElementById('payments-list');
  var btn=list.querySelector('.add-payment-btn');
  list.insertBefore(div.firstChild,btn);
  if(document.querySelectorAll('.payment-row').length>=5&&btn) btn.style.display='none';
}
function removePaymentRow(idx){
  var row=document.getElementById('prow-'+idx);
  if(row) row.remove();
  var btn=document.getElementById('payments-list').querySelector('.add-payment-btn');
  if(btn) btn.style.display='';
  document.querySelectorAll('.payment-row').forEach(function(r,i){r.id='prow-'+i;});
}

async function saveInvestorEdit(){
  var inv=investors.find(function(i){return i.id===editingId;});
  if(!inv){closeModal('edit-investor');return;}
  var btn=document.getElementById('btn-save-inv'); btn.disabled=true; btn.textContent='Saving…';
  var payments=[];
  document.querySelectorAll('.payment-row').forEach(function(r,i){
    var amt=parseFloat(document.getElementById('p-amt-'+i).value)||0;
    var to=(document.getElementById('p-to-'+i).value||'').trim();
    var dir=getPayDir(i);
    if(amt||to) payments.push({amount:amt,to:to,dir:dir});
  });
  var u={fname:document.getElementById('e-fname').value.trim(),lname:document.getElementById('e-lname').value.trim(),
    state:document.getElementById('e-state').value.trim(),capital:parseFloat(document.getElementById('e-capital').value)||0,
    invested:inv.invested||0,share:parseFloat(document.getElementById('e-share').value)||0,
    owed:inv.owed||0,funded:getFunded('e').toLowerCase(),
    notes:document.getElementById('e-notes').value.trim(),payments:payments,
    extra_funding:[
      {amt:parseFloat(document.getElementById('e-extra1-amt').value)||0, by:getExtraFunded(1)},
      {amt:parseFloat(document.getElementById('e-extra2-amt').value)||0, by:getExtraFunded(2)}
    ]};
  var res=await sb.from('investors').update(u).eq('id',editingId);
  btn.disabled=false; btn.textContent='Save Changes';
  if(res.error){toast('Error saving.');return;}
  Object.assign(inv,u); inv.payments=payments; inv.extraFunding=u.extra_funding;
  editingId=null; closeModal('edit-investor'); renderInvestors(); toast('Saved!');
}

async function removeInvestor(id){
  if(!confirm('Remove this investor? Cannot be undone.')) return;
  await sb.from('investors').delete().eq('id',id);
  investors=investors.filter(function(i){return i.id!==id;});
  renderInvestors(); toast('Removed.');
}

// ── Clickers ──
function renderClicker(person){
  var el = document.getElementById('clicker-'+person+'-content');
  if(!el) return;

  var assigned = clickerAssignments.filter(function(a){return a.clicker===person;});
  var assignedInvs = assigned.map(function(a){return investors.find(function(i){return i.id===a.investor_id;});}).filter(Boolean);

  // Investors not yet assigned to this clicker
  var unassigned = investors.filter(function(i){
    return !assigned.find(function(a){return a.investor_id===i.id;});
  });

  var addBtn = '<div style="margin-bottom:16px;display:flex;gap:8px;align-items:center">'+
    '<div style="position:relative;flex:1">'+
      '<input type="text" id="clicker-search-'+person+'" placeholder="Search investor by name…" oninput="filterClickerSearch(\''+person+'\')" autocomplete="off" style="width:100%">'+
      '<div id="clicker-dropdown-'+person+'" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--accent);border-top:none;border-radius:0 0 4px 4px;max-height:200px;overflow-y:auto;z-index:50;"></div>'+
    '</div>'+
    '<button class="btn" onclick="assignToClickerByName(\''+person+'\')">+ Add</button>'+
  '</div>';

  if(!assignedInvs.length){
    el.innerHTML = addBtn+'<div style="color:var(--muted);padding:40px;text-align:center;background:var(--surface);border:1px solid var(--border);border-radius:4px">No investors assigned yet. Add one above!</div>';
    return;
  }

  var cards = assignedInvs.map(function(inv){
    var owed = calcOwed(inv);
    var ap = calcAP(inv);
    return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;margin-bottom:10px;overflow:hidden">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px">'+
        '<div>'+
          '<div style="font-family:var(--serif);font-size:18px;font-weight:300">'+inv.fname+' '+inv.lname+'</div>'+
          '<div style="display:flex;gap:10px;margin-top:4px">'+
            (inv.state?'<span style="color:var(--muted);font-size:11px">'+inv.state+'</span>':'')+'&nbsp;'+
            '<span class="tag tag-blue">'+inv.share+'% our way</span>'+
            '<span class="tag '+(inv.funded==='sands'?'tag-red':'tag-green')+'">'+((inv.funded||'client').charAt(0).toUpperCase()+(inv.funded||'client').slice(1))+'</span>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:20px">'+
          '<div style="text-align:right"><div class="stat-label">Acct Profit</div><div class="green" style="font-family:var(--serif);font-size:18px">'+fmt(ap)+'</div></div>'+
          '<div style="text-align:right"><div class="stat-label">Owed</div><div class="red" style="font-family:var(--serif);font-size:18px">'+fmt(owed)+'</div></div>'+
          '<button class="btn btn-red btn-sm" onclick="removeFromClicker(\''+person+'\','+inv.id+')">Remove</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  el.innerHTML = addBtn + cards;
}

async function assignToClicker(person){
  var sel = document.getElementById('clicker-select-'+person);
  var invId = parseInt(sel.value);
  if(!invId) return;
  var res = await sb.from('clicker_assignments').insert({clicker:person, investor_id:invId}).select().single();
  if(res.error){ toast('Error assigning investor.'); return; }
  clickerAssignments.push(res.data);
  renderClicker(person);
  toast('Investor added to '+person+'\'s list!');
}

function filterClickerSearch(person){
  var q = (document.getElementById('clicker-search-'+person).value||'').toLowerCase();
  var dropdown = document.getElementById('clicker-dropdown-'+person);
  var assigned = clickerAssignments.filter(function(a){return a.clicker===person;});
  var unassigned = investors.filter(function(i){
    return !assigned.find(function(a){return a.investor_id===i.id;});
  });
  if(!q){ dropdown.style.display='none'; return; }
  var matches = unassigned.filter(function(i){
    return (i.fname+' '+i.lname).toLowerCase().indexOf(q)>=0;
  });
  if(!matches.length){
    dropdown.innerHTML='<div style="padding:10px 14px;color:var(--muted);font-size:12px">No results</div>';
  } else {
    dropdown.innerHTML = matches.map(function(i){
      return '<div onclick="selectClickerInvestor(\''+person+'\','+i.id+',\''+i.fname+' '+i.lname+'\')" '+
        'style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" '+
        'onmouseover="this.style.background=\'var(--surface2)\'" onmouseout="this.style.background=\'\'">'+
        i.fname+' '+i.lname+(i.state?' <span style="color:var(--muted);font-size:11px">'+i.state+'</span>':'')+
      '</div>';
    }).join('');
  }
  dropdown.style.display='block';
}

function selectClickerInvestor(person, id, name){
  var input = document.getElementById('clicker-search-'+person);
  var dropdown = document.getElementById('clicker-dropdown-'+person);
  input.value = name;
  input.dataset.selectedId = id;
  dropdown.style.display='none';
}

async function assignToClickerByName(person){
  var input = document.getElementById('clicker-search-'+person);
  var invId = parseInt(input.dataset.selectedId);
  if(!invId){ toast('Please select an investor from the list.'); return; }
  var res = await sb.from('clicker_assignments').insert({clicker:person, investor_id:invId}).select().single();
  if(res.error){ toast('Already assigned or error.'); return; }
  clickerAssignments.push(res.data);
  input.value=''; input.dataset.selectedId='';
  renderClicker(person);
  toast('Investor added to '+person+'\'s list!');
}

async function removeFromClicker(person, invId){
  await sb.from('clicker_assignments').delete().eq('clicker',person).eq('investor_id',invId);
  clickerAssignments = clickerAssignments.filter(function(a){ return !(a.clicker===person && a.investor_id===invId); });
  renderClicker(person);
  toast('Removed from list.');
}

// ── Package Overview ──
function renderOverview(){
  var list=[].concat(investors).sort(function(a,b){return calcOwed(b)-calcOwed(a);});
  document.getElementById('overview-sub').textContent=list.length+' investor'+(list.length!==1?'s':'');
  if(!list.length){
    document.getElementById('overview-cards').innerHTML='<div style="color:var(--muted);padding:40px;text-align:center;background:var(--surface);border:1px solid var(--border);border-radius:4px">No investors yet.</div>';
    return;
  }
  var totalOwed=investors.reduce(function(a,inv){return a+Math.max(0,calcOwed(inv));},0);
  var totalAP=investors.reduce(function(a,inv){return a+calcAP(inv);},0);
  var html='<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">'+
    '<div class="stat-card"><div class="stat-label">Total Investors</div><div class="stat-val">'+list.length+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">Total Acct Profits</div><div class="stat-val green">'+fmt(totalAP)+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">Total Outstanding</div><div class="stat-val red">'+fmt(totalOwed)+'</div></div>'+
  '</div>';
  html+='<div class="card"><table>'+
    '<thead><tr><th>Name</th><th>State</th><th>Funded</th><th>Acct Profit</th><th>% Our Way</th><th>Paid</th><th>Balance</th></tr></thead>'+
    '<tbody>'+list.map(function(inv){
      var owed=calcOwed(inv);
      var ap=calcAP(inv);
      var paid=(inv.payments||[]).reduce(function(a,p){
        return a+(p.dir==='out'?-Number(p.amount||0):Number(p.amount||0));
      },0);
      var owedClass=owed<0?'green':owed>0?'red':'';
      var owedDisplay=owed<0?'We owe: '+fmt(Math.abs(owed)):owed>0?fmt(owed):'—';
      return '<tr>'+
        '<td><strong>'+inv.fname+' '+inv.lname+'</strong></td>'+
        '<td style="color:var(--muted)">'+(inv.state||'—')+'</td>'+
        '<td><span class="tag '+(inv.funded==='sands'?'tag-red':'tag-green')+'">'+(inv.funded?inv.funded.charAt(0).toUpperCase()+inv.funded.slice(1):'—')+'</span></td>'+
        '<td class="'+(ap<0?'red':'green')+'">'+fmt(ap)+'</td>'+
        '<td>'+inv.share+'%<div class="progress"><div class="progress-fill" style="width:'+Math.min(inv.share,100)+'%"></div></div></td>'+
        '<td style="color:var(--muted)">'+fmt(paid)+'</td>'+
        '<td class="'+owedClass+'" style="font-family:var(--serif);font-size:15px;font-weight:600">'+owedDisplay+'</td>'+
      '</tr>';
    }).join('')+'</tbody></table></div>';
  document.getElementById('overview-cards').innerHTML=html;
}

// ── Packages That Owe ──
function renderOwed(){
  var list=investors.filter(function(inv){return calcOwed(inv)>0;});
  list.sort(function(a,b){return calcOwed(b)-calcOwed(a);});
  document.getElementById('owed-sub').textContent=list.length+' investor'+(list.length!==1?'s':'')+' with outstanding balances';
  if(!list.length){
    document.getElementById('owed-cards').innerHTML='<div style="color:var(--muted);padding:40px;text-align:center;background:var(--surface);border:1px solid var(--border);border-radius:4px">🎉 No outstanding balances — all caught up!</div>';
    return;
  }
  var totalOwed=list.reduce(function(a,inv){return a+calcOwed(inv);},0);
  var html='<div class="stats-grid" style="grid-template-columns:1fr 1fr;margin-bottom:20px">'+
    '<div class="stat-card"><div class="stat-label">Total Outstanding</div><div class="stat-val red">'+fmt(totalOwed)+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">Packages Pending</div><div class="stat-val">'+list.length+'</div></div>'+
  '</div>';
  html+='<div class="card"><table>'+
    '<thead><tr><th>Name</th><th>State</th><th>Acct Profit</th><th>% Our Way</th><th>Paid</th><th>Owed</th></tr></thead>'+
    '<tbody>'+list.map(function(inv){
      var owed=calcOwed(inv);
      var ap=calcAP(inv);
      var paid=(inv.payments||[]).reduce(function(a,p){
        return a+(p.dir==='out'?-Number(p.amount||0):Number(p.amount||0));
      },0);
      return '<tr>'+
        '<td><strong>'+inv.fname+' '+inv.lname+'</strong></td>'+
        '<td style="color:var(--muted)">'+(inv.state||'—')+'</td>'+
        '<td class="'+(ap<0?'red':'green')+'">'+fmt(ap)+'</td>'+
        '<td>'+inv.share+'%<div class="progress"><div class="progress-fill" style="width:'+Math.min(inv.share,100)+'%"></div></div></td>'+
        '<td style="color:var(--muted)">'+fmt(paid)+'</td>'+
        '<td class="red" style="font-family:var(--serif);font-size:16px;font-weight:600">'+fmt(owed)+'</td>'+
      '</tr>';
    }).join('')+'</tbody></table></div>';
  document.getElementById('owed-cards').innerHTML=html;
}

// ── Modals ──
function closeModal(name){ document.getElementById('modal-'+name).classList.remove('open'); }
document.querySelectorAll('.modal-bg').forEach(function(m){
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('open');});
});

// ── Mobile Sidebar ──
function openMobileSidebar(){
  document.getElementById('mobile-sidebar').classList.add('open');
  document.getElementById('mobile-overlay').classList.add('open');
}
function closeMobileSidebar(){
  document.getElementById('mobile-sidebar').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('open');
}

// ── Close clicker dropdowns on outside click ──
document.addEventListener('click', function(e){
  document.querySelectorAll('[id^="clicker-dropdown-"]').forEach(function(d){
    var searchId = d.id.replace('clicker-dropdown-','clicker-search-');
    var input = document.getElementById(searchId);
    if(input && !input.contains(e.target) && !d.contains(e.target)){
      d.style.display='none';
    }
  });
});

// ── Password ──
document.getElementById('pw-btn').addEventListener('click', function(){
  var val = document.getElementById('pw-input').value.trim().toLowerCase();
  if(val==='scotty'){
    sessionStorage.setItem('fm_auth','1');
    document.getElementById('pw-screen').style.display='none';
    document.getElementById('app').style.display='block';
    loadAll();
    setInterval(function(){ document.getElementById('clock').textContent=new Date().toLocaleTimeString(); },1000);
    document.getElementById('clock').textContent=new Date().toLocaleTimeString();
  } else {
    document.getElementById('pw-error').textContent='Incorrect password.';
    document.getElementById('pw-input').value='';
    document.getElementById('pw-input').focus();
  }
});

document.getElementById('pw-input').addEventListener('keydown', function(e){
  if(e.key==='Enter') document.getElementById('pw-btn').click();
});

// ── Init ──
if(sessionStorage.getItem('fm_auth')==='1'){
  document.getElementById('pw-screen').style.display='none';
  document.getElementById('app').style.display='block';
  loadAll();
  setInterval(function(){ document.getElementById('clock').textContent=new Date().toLocaleTimeString(); },1000);
  document.getElementById('clock').textContent=new Date().toLocaleTimeString();
}
</script>
</body>
</html>
