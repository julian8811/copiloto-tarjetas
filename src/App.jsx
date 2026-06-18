import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { ML } from "./utils/ml.js";
import { genAlerts } from "./utils/alerts.js";
import { useAuth } from "./hooks/useAuth.js";
import { useDataStore } from "./hooks/useDataStore.js";
import { AuthScreen } from "./components/AuthScreen.jsx";

// Safe wrappers in case libraries aren't available
const getXLSX = () => {
  if (typeof XLSX !== "undefined") return XLSX;
  if (typeof window !== "undefined" && window.XLSX) return window.XLSX;
  return null;
};
const getMammoth = () => {
  if (typeof mammoth !== "undefined") return mammoth;
  if (typeof window !== "undefined" && window.mammoth) return window.mammoth;
  return null;
};

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900&family=Space+Mono:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#0b141d;--bg2:#0B121E;--bg3:#182029;--bg4:#222b34;
  --b1:rgba(58,74,68,0.25);--b2:rgba(131,149,141,0.2);--b3:rgba(185,203,195,0.15);
  --t:#F0F4FC;--m:#8A99AF;--s:#b9cbc3;--d:#dbe3f0;
  --tl:#00e0b7;--tl2:#00b5a4;--tlb:rgba(0,224,183,0.12);--tlbr:rgba(0,255,209,0.22);
  --rd:#ffb4ab;--rdb:rgba(255,180,171,0.09);--rdbr:rgba(255,69,96,0.22);
  --or:#ffb689;--orb:rgba(255,182,137,0.09);--orbr:rgba(255,144,64,0.22);
  --vi:#9b6fff;--vib:rgba(155,111,255,0.09);--vibr:rgba(155,111,255,0.22);
  --gn:#15ffd1;--gnb:rgba(21,255,209,0.09);--gnbr:rgba(21,255,209,0.22);
  --bl:#4d9eff;--blb:rgba(77,158,255,0.09);--blbr:rgba(77,158,255,0.22);
  --fn:'Plus Jakarta Sans',sans-serif;--mo:'Space Mono',monospace;
  --r1:10px;--r2:14px;--r3:18px;--r4:22px;--r5:28px;
}
html,body{height:100%;background:#020810;overflow:hidden}
#root{height:100vh;display:flex;justify-content:center;align-items:center;
  background:radial-gradient(ellipse 80% 50% at 50% -5%,rgba(0,224,183,0.08),transparent)}
.app{
  width:100%;max-width:430px;height:100vh;background:var(--bg);
  font-family:var(--fn);color:var(--t);display:flex;flex-direction:column;
  position:relative;overflow:hidden;
  box-shadow:0 0 0 1px var(--b1),0 40px 120px rgba(0,0,0,.9)
}
.main-col{flex:1;display:flex;flex-direction:column;min-width:0;position:relative;overflow:hidden}
.sidebar{display:none;flex-direction:column;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--b1)}
.sb-brand-block{padding:22px 18px 18px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:11px}
.sb-brand-block h2{font-size:15px;font-weight:800;color:var(--tl);line-height:1.15}
.sb-brand-block p{font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--m)}
.sb-nav{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
.sb-item{display:flex;align-items:center;gap:11px;width:100%;padding:11px 14px;border:none;border-radius:12px;
  background:none;cursor:pointer;color:var(--m);font-family:var(--fn);font-size:13px;font-weight:700;
  transition:all .2s;text-align:left;position:relative}
.sb-item:hover{color:var(--d);background:rgba(255,255,255,0.03)}
.sb-item.on{color:var(--tl);background:rgba(0,223,200,0.08)}
.sb-item svg{width:20px;height:20px;stroke-width:1.7;flex-shrink:0}
.sb-item .ndot{top:10px;right:12px}
.sb-foot{padding:14px 18px;border-top:1px solid var(--b1);font-size:10px;color:var(--m);line-height:1.5}
.px{padding-left:20px;padding-right:20px}
.page-pad{padding:0 20px 16px}
.mx{margin-left:20px;margin-right:20px}
.mx-m{margin:0 20px 14px}
.mx-b{margin:0 20px 16px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.g4{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.chart-box{margin:0 20px 16px;padding:14px 10px;border-radius:18px;background:var(--bg2);border:1px solid var(--b1)}
.chart-h{height:130px}
.hero-kpi{margin:0 20px 16px;padding:20px 22px;border-radius:22px;background:linear-gradient(140deg,#030f1e,#061c18);
  border:1px solid rgba(0,223,200,0.1);position:relative;overflow:hidden}
.cards-row{display:flex;gap:11px;overflow-x:auto;padding:2px 20px 14px;
  -webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}
.cards-row::-webkit-scrollbar{display:none}
.cards-row>*{scroll-snap-align:start;flex-shrink:0}
.cards-page-grid{display:flex;flex-direction:column;gap:0}
.card-entry{margin:0 20px 18px}
.cc-vis{min-width:min(100%,280px);width:100%}
.dash-split{display:block}
.analytics-pair{display:block}
.copilot-scr{display:flex;flex-direction:column;height:100%;padding-bottom:0}
.copilot-msgs{flex:1;overflow-y:auto;padding:0 20px 10px;display:flex;flex-direction:column;gap:10px}
.copilot-foot{flex-shrink:0;padding:10px 20px 88px;border-top:1px solid var(--b1);background:var(--bg);display:flex;gap:9}
.tab-row{display:flex;gap:6;padding:0 20px 18px;flex-wrap:nowrap}
.tab-btn{flex:1;padding:9px 4px;border-radius:11px;background:var(--bg3);border:1px solid var(--b1);
  color:var(--s);font-size:11px;font-weight:700;cursor:pointer;font-family:var(--fn);transition:all .15s;min-width:0}
.tab-btn.on{background:var(--tlb);border-color:var(--tlbr);color:var(--tl)}
.glass{background:rgba(11,18,30,0.6);backdrop-filter:blur(12px);border:1px solid var(--b1)}
.neon{box-shadow:0 0 12px rgba(0,255,209,0.3)}
.brand-logo{width:28px;height:28px;border-radius:8px;object-fit:cover;border:1px solid var(--tlbr)}
.scr{flex:1;overflow-y:auto;overflow-x:hidden;padding-bottom:88px}
.scr::-webkit-scrollbar{display:none}

/* NAV BAR */
.nav{
  position:absolute;bottom:0;left:0;right:0;height:80px;
  background:rgba(2,8,16,0.96);backdrop-filter:blur(28px) saturate(200%);
  border-top:1px solid var(--b2);display:flex;padding:8px 4px 18px;z-index:80
}
.nt{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:4px;background:none;border:none;cursor:pointer;color:var(--m);transition:all .2s;
  border-radius:12px;position:relative;padding:6px 2px}
.nt.on{color:var(--tl);background:rgba(0,223,200,0.08)}
.nt svg{width:21px;height:21px;stroke-width:1.7}
.nt span{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
.nt:active{transform:scale(.94)}
.ndot{position:absolute;top:7px;right:calc(50% - 14px);
  width:7px;height:7px;background:var(--rd);border:2px solid var(--bg);border-radius:50%}

/* STATUS BAR */
.sb{height:52px;display:flex;align-items:center;justify-content:space-between;
  padding:0 16px;flex-shrink:0;background:var(--bg);border-bottom:1px solid var(--b1)}
.sb-brand{display:flex;align-items:center;gap:8px;min-width:0}
.sb-brand h1{font-size:13px;font-weight:800;color:var(--tl);letter-spacing:-.02em;line-height:1.1}
.sb-brand p{font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}

/* TYPOGRAPHY */
.h1{font-size:26px;font-weight:900;letter-spacing:-.03em;line-height:1.1}
.h2{font-size:20px;font-weight:800;letter-spacing:-.025em}
.h3{font-size:15px;font-weight:700}
.lbl{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}
.mono{font-family:var(--mo)}

/* CARDS */
.card{background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r4);padding:18px}
.card2{background:var(--bg3);border:1px solid var(--b1);border-radius:var(--r3);padding:15px}
.card3{background:var(--bg3);border:1px solid var(--b1);border-radius:var(--r2);padding:12px}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;
  border:none;cursor:pointer;font-family:var(--fn);font-weight:700;
  letter-spacing:.01em;transition:all .18s;white-space:nowrap;border-radius:var(--r2)}
.btn:active{transform:scale(.95)}
.bp{background:linear-gradient(135deg,var(--tl),#00ffd1);color:#002019;
  font-size:14px;padding:14px 22px;width:100%}
.bp:hover{box-shadow:0 6px 30px rgba(0,223,200,0.28);transform:translateY(-1px)}
.bs{background:var(--bg3);border:1px solid var(--b2);color:var(--d);
  font-size:13px;padding:11px 16px}
.bg{background:transparent;border:1px solid var(--b1);color:var(--s);
  font-size:11px;padding:7px 13px;border-radius:var(--r1)}
.br{background:var(--rdb);border:1px solid var(--rdbr);color:var(--rd);
  font-size:12px;padding:9px 14px}
.bi{width:38px;height:38px;border-radius:var(--r2);background:var(--bg3);
  border:1px solid var(--b2);color:var(--s)}

/* INPUTS */
.inp{background:var(--bg3);border:1px solid var(--b2);border-radius:var(--r2);
  color:var(--t);font-family:var(--fn);font-size:14px;
  padding:13px 15px;width:100%;outline:none;transition:border-color .2s}
.inp:focus{border-color:var(--tlbr)}
.inp::placeholder{color:var(--m)}
select.inp{appearance:none;cursor:pointer}
.ilbl{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  color:var(--s);display:block;margin-bottom:5px}

/* PILLS */
.pill{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;
  border-radius:100px;font-size:10px;font-weight:800;letter-spacing:.03em}
.ptl{background:var(--tlb);color:var(--tl);border:1px solid var(--tlbr)}
.prd{background:var(--rdb);color:var(--rd);border:1px solid var(--rdbr)}
.por{background:var(--orb);color:var(--or);border:1px solid var(--orbr)}
.pgn{background:var(--gnb);color:var(--gn);border:1px solid var(--gnbr)}
.pvi{background:var(--vib);color:var(--vi);border:1px solid var(--vibr)}
.pbl{background:var(--blb);color:var(--bl);border:1px solid var(--blbr)}
.pm{background:rgba(255,255,255,0.04);color:var(--s);border:1px solid var(--b1)}

/* PROGRESS BARS */
.bt{height:5px;background:rgba(255,255,255,0.05);border-radius:100px;overflow:hidden}
.bf{height:100%;border-radius:100px;transition:width .9s cubic-bezier(.4,0,.2,1)}

/* MODAL / SHEET */
.ov{position:absolute;inset:0;background:rgba(0,0,0,.8);
  backdrop-filter:blur(12px);z-index:100;display:flex;align-items:flex-end}
.sh{background:var(--bg2);border-top:1px solid var(--b2);
  border-radius:24px 24px 0 0;width:100%;max-height:93vh;
  overflow-y:auto;padding:20px 20px 36px;animation:su .28s ease both}
.sh::-webkit-scrollbar{display:none}
.hdl{width:36px;height:4px;background:var(--b2);border-radius:100px;margin:0 auto 20px}

/* ROWS */
.row{display:flex;align-items:center;gap:11px;padding:12px 20px;
  cursor:pointer;transition:background .12s;border-bottom:1px solid var(--b1)}
.row:last-child{border-bottom:none}
.row:active{background:rgba(255,255,255,0.02)}

/* DROP ZONE */
.dz{border:2px dashed rgba(0,223,200,0.2);border-radius:var(--r4);
  padding:36px 20px;text-align:center;transition:all .22s;position:relative}
.dz.ov2{border-color:var(--tl);background:rgba(0,223,200,0.04)}
.dz:hover{border-color:rgba(0,223,200,0.38)}

/* CHAT */
.bai{background:rgba(255,255,255,0.035);border:1px solid var(--b2);
  border-radius:16px 16px 16px 3px;padding:11px 14px;max-width:88%;
  font-size:13px;line-height:1.6;color:var(--d)}
.bus{background:rgba(0,223,200,0.08);border:1px solid var(--tlbr);
  border-radius:16px 16px 3px 16px;padding:11px 14px;max-width:88%;
  margin-left:auto;font-size:13px;color:var(--tl);line-height:1.6}

/* SCROLL H */
.hs{display:flex;gap:11px;overflow-x:auto;padding-bottom:4px;
  -webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}
.hs::-webkit-scrollbar{display:none}
.hs>*{scroll-snap-align:start;flex-shrink:0}

/* TOAST */
.toast{position:absolute;top:54px;left:14px;right:14px;z-index:200;
  background:var(--bg2);border:1px solid var(--b2);border-radius:var(--r3);
  padding:13px 15px;display:flex;align-items:center;gap:9px;
  animation:fu .25s ease;box-shadow:0 12px 40px rgba(0,0,0,.6)}

/* HEADER */
.hdr{display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;margin-bottom:18px}
.sec{display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;margin-bottom:11px}
.badge{position:absolute;top:-2px;right:-2px;min-width:15px;height:15px;
  border-radius:100px;background:var(--rd);border:2px solid var(--bg);
  font-size:8px;font-weight:800;color:#fff;display:flex;
  align-items:center;justify-content:center;padding:0 3px}
.ring{position:relative;display:inline-flex;align-items:center;justify-content:center}

/* RESPONSIVE */
@media(min-width:480px){
  .g4{grid-template-columns:repeat(2,1fr)}
}
@media(min-width:768px){
  html,body{overflow:auto}
  .sidebar .sb-brand-block{display:flex}
  .main-col .sb .sb-brand{display:none}
  #root{align-items:stretch;min-height:100vh;height:auto;padding:0;
    background:radial-gradient(ellipse 90% 40% at 20% -5%,rgba(0,224,183,0.06),transparent),var(--bg)}
  .app{width:100%;max-width:none;height:100vh;min-height:100vh;flex-direction:row;
    box-shadow:none;border-radius:0}
  .sidebar{display:flex;width:220px}
  .main-col{height:100vh}
  .nav{display:none}
  .scr{padding-bottom:28px}
  .sb{height:60px;padding:0 clamp(20px,3vw,36px)}
  .hdr,.sec{padding-left:clamp(20px,3vw,36px);padding-right:clamp(20px,3vw,36px)}
  .px,.page-pad{padding-left:clamp(20px,3vw,36px);padding-right:clamp(20px,3vw,36px)}
  .mx,.mx-m,.mx-b,.chart-box,.hero-kpi,.card-entry{margin-left:clamp(20px,3vw,36px);margin-right:clamp(20px,3vw,36px)}
  .cards-row{padding-left:clamp(20px,3vw,36px);padding-right:clamp(20px,3vw,36px)}
  .tab-row{padding-left:clamp(20px,3vw,36px);padding-right:clamp(20px,3vw,36px)}
  .copilot-msgs,.copilot-foot{padding-left:clamp(20px,3vw,36px);padding-right:clamp(20px,3vw,36px)}
  .h1{font-size:30px}
  .h2{font-size:22px}
  .toast{top:68px;left:50%;right:auto;transform:translateX(-50%);max-width:440px;width:min(440px,90%)}
  .ov{align-items:center;justify-content:center;padding:24px}
  .sh{max-width:540px;border-radius:24px;max-height:90vh;margin:0 auto;border:1px solid var(--b2);
    animation:fu .28s ease both}
  .hdl{display:none}
  .chart-h{height:200px}
  .cards-row.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
    overflow:visible;gap:16px;padding-bottom:20px}
  .cards-row.cards-grid>*{flex-shrink:unset;scroll-snap-align:unset}
  .cc-vis{min-width:0}
  .dash-split{display:grid;grid-template-columns:1.15fr 1fr;gap:18px;
    margin:0 clamp(20px,3vw,36px) 20px;align-items:start}
  .dash-split .chart-box{margin:0}
  .dash-split .card{margin:0}
  .analytics-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;
    margin:0 clamp(20px,3vw,36px) 16px;align-items:start}
  .analytics-pair>*{margin:0!important}
  .cards-page-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
    gap:20px;padding:0 clamp(20px,3vw,36px) 24px}
  .card-entry{margin:0}
  .copilot-foot{padding-bottom:24px;max-width:860px;margin:0 auto;width:100%}
  .copilot-msgs{max-width:860px;margin:0 auto;width:100%}
  .copilot-scr .hs{flex-wrap:wrap;padding-bottom:16px}
  .g4.ml-stats{grid-template-columns:repeat(4,1fr);padding-left:clamp(20px,3vw,36px);
    padding-right:clamp(20px,3vw,36px)}
  .auth-inner{max-width:420px;margin:0 auto;padding:40px 24px}
  .main-col:has(.auth-inner){justify-content:center}
}
@media(min-width:1024px){
  .sidebar{width:248px}
  .chart-h{height:230px}
  .g4:not(.ml-stats){grid-template-columns:repeat(2,1fr)}
}
@media(min-width:1280px){
  .main-col>.scr,.main-col>.copilot-scr{max-width:1100px;margin:0 auto;width:100%}
}

/* ANIMATIONS */
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes sp{to{transform:rotate(360deg)}}
@keyframes pu{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
@keyframes gl{0%,100%{box-shadow:0 0 12px rgba(0,223,200,.2)}50%{box-shadow:0 0 24px rgba(0,223,200,.45)}}
.fadeIn{animation:fu .3s ease both}
.spin{animation:sp .7s linear infinite}
`;

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const COP = n => n == null ? "—" : new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(Math.abs(n));
const PCT = (a,b) => b>0?Math.min(Math.round(a/b*100),100):0;
const UID = () => Math.random().toString(36).slice(2,10);
const TODAY = () => new Date().toISOString().split("T")[0];
const FD = d => { try { return new Date(d+"T12:00:00").toLocaleDateString("es-CO",{day:"numeric",month:"short"}); } catch { return d; } };
const MK = d => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; };
const MNAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const CATS = ["Restaurantes","Supermercado","Transporte","Entretenimiento","Salud","Suscripciones","Viajes","Ropa","Educación","Servicios","Tecnología","Otros"];
const CAT_IC = {Restaurantes:"🍽️",Supermercado:"🛒",Transporte:"🚕",Entretenimiento:"🎬",Salud:"💊",Suscripciones:"📺",Viajes:"✈️",Ropa:"👗",Educación:"📚",Servicios:"⚡",Tecnología:"💻",Otros:"📦"};
const CAT_CL = {Restaurantes:"#ff4560",Supermercado:"#00dfc8",Transporte:"#ff9040",Entretenimiento:"#9b6fff",Salud:"#52d98a",Suscripciones:"#4d9eff",Viajes:"#f472b6",Ropa:"#fb923c",Educación:"#34d399",Servicios:"#818cf8",Tecnología:"#60a5fa",Otros:"#94a3b8"};
const BANKS = ["Bancolombia","Davivienda","Banco de Bogotá","BBVA","Scotiabank Colpatria","Banco Popular","Falabella","Nu Bank","Rappi","Otro"];
const FRAN = ["Visa","Mastercard","American Express","Diners Club"];

/* ══════════════════════════════════════════════════════════
   BRAND LOGOS SVG
══════════════════════════════════════════════════════════ */
const VisaLogo = () => (
  <svg viewBox="0 0 60 20" style={{width:52,height:17,display:"block"}}>
    <text x="0" y="17" fontFamily="Arial" fontWeight="900" fontSize="19" fill="white" letterSpacing="-1">VISA</text>
  </svg>
);
const McLogoFull = () => (
  <svg viewBox="0 0 52 32" style={{width:42,height:26,display:"block"}}>
    <circle cx="18" cy="16" r="15" fill="#EB001B"/>
    <circle cx="34" cy="16" r="15" fill="#F79E1B"/>
    <path d="M26 5.6A15 15 0 0 1 34 16a15 15 0 0 1-8 10.4A15 15 0 0 1 18 16 15 15 0 0 1 26 5.6z" fill="#FF5F00"/>
  </svg>
);
const AmexLogo = () => (
  <svg viewBox="0 0 72 22" style={{width:58,height:17,display:"block"}}>
    <text x="0" y="17" fontFamily="Arial" fontWeight="900" fontSize="14" fill="white" letterSpacing="2">AMEX</text>
  </svg>
);
const DinersLogo = () => (
  <svg viewBox="0 0 70 22" style={{width:52,height:16,display:"block"}}>
    <circle cx="12" cy="11" r="10" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
    <circle cx="20" cy="11" r="10" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"/>
    <text x="34" y="16" fontFamily="Arial" fontWeight="700" fontSize="10" fill="rgba(255,255,255,0.8)">CLUB</text>
  </svg>
);

const BankLogo = ({ bank }) => {
  const style = { display:"block" };
  const map = {
    "Bancolombia": (
      <svg viewBox="0 0 110 28" style={{...style,width:90,height:23}}>
        <rect x="1" y="4" width="20" height="20" rx="4" fill="#FDDA24"/>
        <text x="6" y="19" fontFamily="Arial" fontWeight="900" fontSize="13" fill="#1a1a1a">B</text>
        <text x="26" y="19" fontFamily="Arial" fontWeight="700" fontSize="9.5" fill="white" letterSpacing=".3">BANCOLOMBIA</text>
      </svg>
    ),
    "Davivienda": (
      <svg viewBox="0 0 100 28" style={{...style,width:88,height:23}}>
        <path d="M2 14 L12 4 L22 14 L12 24 Z" fill="#E30613"/>
        <text x="27" y="19" fontFamily="Arial" fontWeight="700" fontSize="9.5" fill="white" letterSpacing=".2">DAVIVIENDA</text>
      </svg>
    ),
    "Banco de Bogotá": (
      <svg viewBox="0 0 116 28" style={{...style,width:96,height:23}}>
        <rect x="1" y="4" width="20" height="20" rx="3" fill="#003F8A"/>
        <text x="5" y="19" fontFamily="Arial" fontWeight="900" fontSize="14" fill="#E8C400">B</text>
        <text x="26" y="19" fontFamily="Arial" fontWeight="700" fontSize="9" fill="white" letterSpacing=".15">BDO BOGOTÁ</text>
      </svg>
    ),
    "BBVA": (
      <svg viewBox="0 0 80 28" style={{...style,width:68,height:23}}>
        <rect x="1" y="4" width="22" height="20" rx="3" fill="#004A97"/>
        <text x="4" y="19" fontFamily="Arial" fontWeight="900" fontSize="12" fill="white">BB</text>
        <text x="28" y="19" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white" letterSpacing="1">BBVA</text>
      </svg>
    ),
    "Scotiabank Colpatria": (
      <svg viewBox="0 0 106 28" style={{...style,width:90,height:23}}>
        <circle cx="12" cy="14" r="11" fill="#EC111A"/>
        <text x="7" y="19" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white">S</text>
        <text x="28" y="19" fontFamily="Arial" fontWeight="700" fontSize="9" fill="white">SCOTIABANK</text>
      </svg>
    ),
    "Nu Bank": (
      <svg viewBox="0 0 72 28" style={{...style,width:62,height:23}}>
        <circle cx="12" cy="14" r="11" fill="#820AD1"/>
        <text x="6" y="19.5" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white">N</text>
        <text x="28" y="19" fontFamily="Arial" fontWeight="900" fontSize="15" fill="white">Nu</text>
      </svg>
    ),
    "Rappi": (
      <svg viewBox="0 0 72 28" style={{...style,width:62,height:23}}>
        <circle cx="12" cy="14" r="11" fill="#FF441A"/>
        <text x="6.5" y="19.5" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white">R</text>
        <text x="28" y="19" fontFamily="Arial" fontWeight="700" fontSize="13" fill="white">Rappi</text>
      </svg>
    ),
  };
  return map[bank] || (
    <svg viewBox="0 0 90 28" style={{...style,width:76,height:23}}>
      <rect x="1" y="4" width="20" height="20" rx="4" fill="rgba(255,255,255,0.15)"/>
      <text x="6.5" y="19" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white">{bank?.charAt(0)||"B"}</text>
      <text x="27" y="19" fontFamily="Arial" fontWeight="600" fontSize="10" fill="rgba(255,255,255,0.8)">{(bank||"Banco").slice(0,12)}</text>
    </svg>
  );
};

const FranLogo = ({ f }) => {
  if (f === "Visa") return <VisaLogo/>;
  if (f === "Mastercard") return <McLogoFull/>;
  if (f === "American Express") return <AmexLogo/>;
  if (f === "Diners Club") return <DinersLogo/>;
  return null;
};

/* ══════════════════════════════════════════════════════════
   CHIP SVG
══════════════════════════════════════════════════════════ */
const Chip = () => (
  <svg viewBox="0 0 46 36" style={{width:44,height:34,display:"block"}}>
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e2c46a"/><stop offset="40%" stopColor="#c4982a"/>
        <stop offset="70%" stopColor="#d4a840"/><stop offset="100%" stopColor="#b08020"/>
      </linearGradient>
    </defs>
    <rect x=".5" y=".5" width="45" height="35" rx="5" fill="url(#cg)" stroke="#9a7020" strokeWidth=".7"/>
    <rect x="15.5" y=".5" width="1.5" height="35" fill="rgba(0,0,0,.18)"/>
    <rect x="29" y=".5" width="1.5" height="35" fill="rgba(0,0,0,.18)"/>
    <rect x=".5" y="12.5" width="45" height="1.5" fill="rgba(0,0,0,.18)"/>
    <rect x=".5" y="22" width="45" height="1.5" fill="rgba(0,0,0,.18)"/>
    <rect x="15.5" y="12.5" width="15" height="11" rx="2" fill="rgba(0,0,0,.12)"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════
   CARD THEMES
══════════════════════════════════════════════════════════ */
const THEMES = {
  teal:   {bg:"linear-gradient(135deg,#061e20 0%,#0a3530 55%,#04201e 100%)",acc:"#00dfc8"},
  navy:   {bg:"linear-gradient(135deg,#060c28 0%,#0d1848 55%,#081030 100%)",acc:"#4d9eff"},
  ruby:   {bg:"linear-gradient(135deg,#1e0610 0%,#380818 55%,#200510 100%)",acc:"#ff4560"},
  gold:   {bg:"linear-gradient(135deg,#1a1000 0%,#2e1e00 55%,#1c1200 100%)",acc:"#f5a623"},
  violet: {bg:"linear-gradient(135deg,#110a28 0%,#1e1040 55%,#130830 100%)",acc:"#9b6fff"},
  slate:  {bg:"linear-gradient(135deg,#0e1420 0%,#182034 55%,#0c1220 100%)",acc:"#96a3b8"},
};
const TKEYS = Object.keys(THEMES);

/* ══════════════════════════════════════════════════════════
   CREDIT CARD COMPONENT
══════════════════════════════════════════════════════════ */
function CCVis({ card, txns, onClick, noAnim }) {
  const theme = THEMES[card.theme] || THEMES.teal;
  const used = useMemo(() => txns.filter(t=>t.cardId===card.id).reduce((s,t)=>s+t.amount,0), [txns,card.id]);
  const p = PCT(used, card.limit);
  const rclr = p>80?"var(--rd)":p>65?"var(--or)":theme.acc;
  return (
    <div onClick={onClick} className="cc-vis" style={{background:theme.bg,borderRadius:22,padding:"22px 24px",position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"transform .2s"}}
      onMouseEnter={e=>{if(!noAnim)e.currentTarget.style.transform="scale(1.015)"}}
      onMouseLeave={e=>{if(!noAnim)e.currentTarget.style.transform="scale(1)"}}>
      {/* Glow blobs */}
      <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:`radial-gradient(circle,${theme.acc}18,transparent 65%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-30,left:-30,width:130,height:130,borderRadius:"50%",background:`radial-gradient(circle,${theme.acc}0c,transparent 65%)`,pointerEvents:"none"}}/>
      {/* Subtle horizontal lines texture */}
      <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 22px,rgba(255,255,255,0.013) 22px,rgba(255,255,255,0.013) 23px)",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        {/* Row 1: bank logo + franchise */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <BankLogo bank={card.bank}/>
          <FranLogo f={card.franchise}/>
        </div>
        {/* Chip row */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <Chip/>
          {/* Contactless icon */}
          <svg viewBox="0 0 24 24" style={{width:22,height:22,opacity:.35}} fill="none" stroke="white" strokeWidth="1.5">
            <path d="M4.93 19.07A10 10 0 0 1 2 12a10 10 0 0 1 2.93-7.07"/>
            <path d="M7.76 16.24A6 6 0 0 1 6 12a6 6 0 0 1 1.76-4.24"/>
            <path d="M10.59 13.41A2 2 0 0 1 10 12a2 2 0 0 1 .59-1.41"/>
          </svg>
        </div>
        {/* Number */}
        <p style={{fontFamily:"var(--mo)",fontSize:13.5,color:`rgba(255,255,255,.38)`,letterSpacing:".2em",marginBottom:14}}>
          •••• •••• •••• {card.last4}
        </p>
        {/* Amount */}
        <div style={{fontSize:30,fontWeight:900,color:rclr,letterSpacing:"-.025em",marginBottom:16,textShadow:`0 0 32px ${rclr}44`}}>
          {COP(used)}
        </div>
        {/* Usage bar */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:9.5,fontWeight:800,color:"rgba(255,255,255,.3)",letterSpacing:".09em"}}>UTILIZACIÓN {p}%</span>
            <span style={{fontSize:9.5,fontWeight:700,color:rclr}}>{COP(card.limit-used)} libre</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:100,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${p}%`,background:`linear-gradient(90deg,${rclr}80,${rclr})`,borderRadius:100,transition:"width .9s ease",boxShadow:`0 0 8px ${rclr}55`}}/>
          </div>
        </div>
        {/* Footer */}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
          <div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)",marginBottom:2,letterSpacing:".08em"}}>TITULAR</div>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.65)"}}>{card.holder||"SU NOMBRE"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)",marginBottom:2,letterSpacing:".08em"}}>CORTE / PAGO</div>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.65)"}}>Día {card.cutDay} / Día {card.payDay}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FILE PARSER — robust multi-format
══════════════════════════════════════════════════════════ */
const FP = {
  catFrom(name="") {
    const n=name.toLowerCase();
    if(/rest|food|mcdonald|burger|kfc|pizza|sushi|pollo|taco|café|cafe|restaur|comida|andrés|andres|gourmet/.test(n)) return "Restaurantes";
    if(/éxito|exito|carulla|jumbo|supermer|alkosto|ara\b|d1\b|market|superk|olimpica|olímpica/.test(n)) return "Supermercado";
    if(/uber|didi|taxi|cabify|indrive|transm|metro|bus\b|parking|peaje|gasolina|bp\b|esso|combustible/.test(n)) return "Transporte";
    if(/netflix|spotify|amazon|apple\s?tv|google\s?play|youtube|hbo|disney|prime\s?video|xbox|steam|deezer|tidal/.test(n)) return "Suscripciones";
    if(/farmac|drogu|médico|medico|clínica|clinica|hospital|salud|eps|medicina|doctor|laborat/.test(n)) return "Salud";
    if(/avianca|latam|vivacol|hotel|marriott|airbnb|booking|despegar|viaje|aeropuerto/.test(n)) return "Viajes";
    if(/zara|h&m|nike|adidas|decathlon|forever\s?21|ropa|moda|falabella|arturo\s?calle|tennis|bershka/.test(n)) return "Ropa";
    if(/cine|teatro|boleter|parque|entrad|concierto|estadio|movie|netflix|disney/.test(n)) return "Entretenimiento";
    if(/claro|movistar|tigo|epm|etb|codensa|gas\s?natural|aguas|servicio|public/.test(n)) return "Servicios";
    if(/apple\s?store|samsung|pc|tecnolog|celular|laptop|computador|dell|hp\b|lenovo/.test(n)) return "Tecnología";
    if(/universidad|colegio|curso|udemy|platzi|educaci|sena\b/.test(n)) return "Educación";
    return "Otros";
  },
  parseAmt(v) {
    if(typeof v==="number") return Math.abs(v);
    const s=String(v||"").replace(/[$\sCOP]/gi,"");
    // Handle both 1.234,56 (EU) and 1,234.56 (US) and 1234567 (plain)
    const dots=s.split(".").length-1,commas=s.split(",").length-1;
    let clean=s;
    if(dots>1) clean=s.replace(/\./g,"").replace(",",".");
    else if(commas>1) clean=s.replace(/,/g,"");
    else if(dots===1&&commas===1) clean=s.indexOf(".")>s.indexOf(",")?s.replace(",",""):s.replace(".","").replace(",",".");
    else if(dots===1) clean=s;
    else if(commas===1) clean=s.replace(",",".");
    const n=parseFloat(clean);
    return isNaN(n)?0:Math.abs(n);
  },
  parseDateStr(v) {
    if(!v) return TODAY();
    if(v instanceof Date) return isNaN(v)?TODAY():v.toISOString().split("T")[0];
    const s=String(v).trim();
    // DD/MM/YYYY or DD-MM-YYYY
    let m=s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if(m){const y=m[3].length===2?"20"+m[3]:m[3];return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;}
    // YYYY-MM-DD
    m=s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if(m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    // Excel serial (e.g. 45123)
    if(/^\d{5}$/.test(s)){
      const d=new Date(Math.round((parseFloat(s)-25569)*86400*1000));
      if(!isNaN(d)) return d.toISOString().split("T")[0];
    }
    // Try native Date parse
    const d=new Date(s);
    if(!isNaN(d)) return d.toISOString().split("T")[0];
    return TODAY();
  },

  /* ── CSV PARSER (pure JS, no library) ── */
  parseCSVText(text) {
    const rows=[];
    const lines=text.split(/\r?\n/);
    for(const line of lines){
      if(!line.trim()) continue;
      const row=[];let cur="",inQ=false;
      for(let i=0;i<line.length;i++){
        const c=line[i];
        if(c==='"'&&!inQ){inQ=true;}
        else if(c==='"'&&inQ&&line[i+1]==='"'){cur+='"';i++;}
        else if(c==='"'&&inQ){inQ=false;}
        else if((c===','||c===';'||c==='\t')&&!inQ){row.push(cur.trim());cur="";}
        else cur+=c;
      }
      row.push(cur.trim());
      rows.push(row);
    }
    return rows;
  },

  /* ── EXCEL / CSV ── */
  async parseExcel(file) {
    const ext = file.name.split(".").pop().toLowerCase();

    // ── CSV / TXT: pure JS, no library needed ──
    if (ext === "csv" || ext === "txt") {
      return new Promise(resolve => {
        const rdr = new FileReader();
        rdr.onerror = () => resolve({ txns: [], count: 0, err: "No se pudo leer el archivo de texto" });
        rdr.onload = e => {
          try {
            const rows = this.parseCSVText(e.target.result);
            resolve(this._rowsToTxns(rows, file.name));
          } catch (err) {
            resolve({ txns: [], count: 0, err: err.message });
          }
        };
        rdr.readAsText(file, "utf-8");
      });
    }

    // ── Excel: use SheetJS library ──
    return new Promise(resolve => {
      const rdr = new FileReader();
      rdr.onerror = () => resolve({ txns: [], count: 0, err: "No se pudo leer el archivo Excel" });
      rdr.onload = e => {
        try {
          const XLSXLib = getXLSX();
          if (!XLSXLib) {
            // Fallback: try reading as CSV text
            const text = new TextDecoder("utf-8").decode(e.target.result);
            const rows = this.parseCSVText(text);
            const res = this._rowsToTxns(rows, file.name);
            res.err = res.count === 0 ? "Librería Excel no disponible. Exporta como CSV." : null;
            resolve(res);
            return;
          }
          const wb = XLSXLib.read(new Uint8Array(e.target.result), {
            type: "array", cellDates: true, cellText: false, raw: false
          });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSXLib.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
          resolve(this._rowsToTxns(rows, file.name));
        } catch (err) {
          // Last resort: try as CSV text
          try {
            const text = new TextDecoder("utf-8").decode(e.target.result);
            const rows = this.parseCSVText(text);
            resolve(this._rowsToTxns(rows, file.name));
          } catch {
            resolve({ txns: [], count: 0, err: "Error procesando Excel: " + err.message });
          }
        }
      };
      rdr.readAsArrayBuffer(file);
    });
  },

  _rowsToTxns(rows,fname) {
    if(!rows||rows.length<2) return {txns:[],count:0};
    // Find header row (first row with recognizable column names)
    let hdrIdx=0;
    for(let i=0;i<Math.min(6,rows.length);i++){
      const r=rows[i].map(c=>String(c).toLowerCase());
      if(r.some(c=>/descr|nomb|comerc|concept|establec|detall/.test(c))) {hdrIdx=i;break;}
    }
    const hdr=rows[hdrIdx].map(c=>String(c).toLowerCase().trim());
    const nameI=hdr.findIndex(h=>/descr|nomb|comerc|concept|establec|detall/.test(h));
    const amtI=hdr.findIndex(h=>/valor|monto|amount|débito|debito|cargo|pago|cargos/.test(h));
    const dateI=hdr.findIndex(h=>/fecha|date/.test(h));
    const catI=hdr.findIndex(h=>/categ|tipo/.test(h));
    const txns=[];
    for(let i=hdrIdx+1;i<rows.length;i++){
      const r=rows[i];
      if(!r||r.every(c=>c===""||c===null||c===undefined)) continue;
      const rawName=r[nameI>=0?nameI:0];
      const rawAmt=r[amtI>=0?amtI:1];
      const rawDate=r[dateI>=0?dateI:2];
      const rawCat=catI>=0?r[catI]:"";
      const name=String(rawName||"").trim();
      const amt=this.parseAmt(rawAmt);
      if(!name||amt<500||amt>100000000) continue;
      const date=this.parseDateStr(rawDate);
      const cat=rawCat?CATS.find(c=>String(rawCat).toLowerCase().includes(c.toLowerCase().slice(0,5)))||this.catFrom(name):this.catFrom(name);
      txns.push({id:UID(),name:name.slice(0,60),amount:amt,cat,date,cuotas:1,cuotaNum:1,note:`📊 ${fname}`});
    }
    return {txns,count:txns.length};
  },

  /* ── WORD (.docx) ── */
  async parseWord(file) {
    return new Promise(resolve => {
      const rdr = new FileReader();
      rdr.onerror = () => resolve({ txns: [], count: 0, err: "No se pudo leer el archivo Word" });
      rdr.onload = async e => {
        try {
          const mammothLib = getMammoth();
          if (!mammothLib) {
            // Fallback: extract readable text from binary
            const text = new TextDecoder("latin1").decode(e.target.result);
            const res = this._textToTxns(text, file.name, "📄");
            res.err = res.count === 0 ? "Librería Word no disponible. Copia el contenido a un .txt" : null;
            resolve(res);
            return;
          }
          const result = await mammothLib.extractRawText({ arrayBuffer: e.target.result });
          resolve(this._textToTxns(result.value, file.name, "📄"));
        } catch (err) {
          // Fallback: try raw text extraction
          try {
            const bytes = new Uint8Array(e.target.result);
            let text = "";
            for (let i = 0; i < bytes.length; i++) {
              const b = bytes[i];
              if (b >= 32 && b < 127) text += String.fromCharCode(b);
              else if (text.slice(-1) !== " ") text += " ";
            }
            const res = this._textToTxns(text, file.name, "📄");
            resolve(res.count > 0 ? res : { txns: [], count: 0, err: "Error procesando Word: " + err.message });
          } catch {
            resolve({ txns: [], count: 0, err: "Error procesando Word: " + err.message });
          }
        }
      };
      rdr.readAsArrayBuffer(file);
    });
  },

  /* ── PLAIN TEXT / KEEP NOTES ── */
  async parseTxt(file) {
    return new Promise(resolve=>{
      const rdr=new FileReader();
      rdr.onerror=()=>resolve({txns:[],count:0,err:"Error leyendo texto"});
      rdr.onload=e=>resolve(this._textToTxns(e.target.result,file.name,"📝"));
      rdr.readAsText(file,"utf-8");
    });
  },

  _textToTxns(text,fname,icon) {
    const lines=text.split(/\r?\n/).filter(l=>l.trim().length>2);
    const txns=[];
    // Patterns to extract transactions from free text
    const patterns=[
      // "Comercio - $1.234.567" or "Comercio $1.234.567"
      /^(.{2,50}?)[\s\-–—]+\$?\s*([\d.,]{4,15})\s*(?:COP|cop)?/,
      // "$1.234.567 Comercio"
      /^\$?\s*([\d.,]{4,15})\s+(.{2,50})/,
      // Table-like: "Comercio   1234567   fecha"
      /^(.{2,40}?)\s{2,}([\d.,]{4,15})/,
    ];
    for(const line of lines){
      const clean=line.trim();
      for(const pat of patterns){
        const m=clean.match(pat);
        if(!m) continue;
        let name,amtStr;
        if(pat.source.startsWith("^\\$")){amtStr=m[1];name=m[2];}
        else{name=m[1];amtStr=m[2]||m[3]||"0";}
        const amt=this.parseAmt(amtStr);
        if(amt<500||amt>100000000) continue;
        name=name.replace(/[\-–—:*#]+/g,"").trim();
        if(name.length<2) continue;
        txns.push({id:UID(),name:name.slice(0,60),amount:amt,cat:this.catFrom(name),date:TODAY(),cuotas:1,cuotaNum:1,note:`${icon} ${fname}`});
        break;
      }
    }
    return {txns,count:txns.length};
  },

  /* ── PDF (text extraction via byte scanning) ── */
  async parsePDF(file) {
    return new Promise(resolve=>{
      const rdr=new FileReader();
      rdr.onerror=()=>resolve({txns:[],count:0,err:"Error leyendo PDF"});
      rdr.onload=e=>{
        try{
          const bytes=new Uint8Array(e.target.result);
          // Extract readable ASCII chunks
          let chunks=[],cur="";
          for(let i=0;i<bytes.length;i++){
            const b=bytes[i];
            if(b>=32&&b<127){cur+=String.fromCharCode(b);}
            else{if(cur.length>3){chunks.push(cur);}cur="";}
          }
          if(cur.length>3) chunks.push(cur);
          const fullText=chunks.join(" ");
          // Find amounts: numbers with thousands separators
          const amtRx=/\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\b/g;
          const matches=[...fullText.matchAll(amtRx)];
          const seen=new Set();
          const txns=[];
          for(const m of matches){
            const amt=this.parseAmt(m[0]);
            if(amt<5000||amt>50000000) continue;
            const key=Math.round(amt/1000);
            if(seen.has(key)) continue;
            seen.add(key);
            // Extract merchant name from ~80 chars before amount
            const idx=m.index||0;
            const before=fullText.slice(Math.max(0,idx-90),idx);
            const words=before.split(/\s+/).filter(w=>w.length>2&&!/^\d/.test(w)&&w.length<30&&!/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]*$/.test(w));
            const name=words.slice(-4).join(" ")||"Movimiento";
            txns.push({id:UID(),name:name.trim().slice(0,60),amount:amt,cat:this.catFrom(name),date:TODAY(),cuotas:1,cuotaNum:1,note:`📑 ${file.name}`});
          }
          resolve({txns:txns.slice(0,60),count:Math.min(txns.length,60)});
        }catch(err){resolve({txns:[],count:0,err:err.message});}
      };
      rdr.readAsArrayBuffer(file);
    });
  },

  /* ── MAIN DISPATCHER ── */
  async parse(file,cardId) {
    const ext=file.name.split(".").pop().toLowerCase();
    let res;
    if(["xlsx","xls"].includes(ext)) res=await this.parseExcel(file);
    else if(ext==="csv") res=await this.parseExcel(file); // reuses same path w/ CSV branch
    else if(["docx","doc"].includes(ext)) res=await this.parseWord(file);
    else if(["txt","md"].includes(ext)) res=await this.parseTxt(file);
    else if(ext==="pdf") res=await this.parsePDF(file);
    else res={txns:[],count:0,err:"Formato no soportado: "+ext};
    // Assign card
    res.txns=(res.txns||[]).map(t=>({...t,cardId}));
    return res;
  }
};

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
const IC={
  Home:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Card:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Plus:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  Chart:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  Bot:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><line x1="7" y1="15" x2="7.01" y2="15" strokeLinecap="round" strokeWidth="3"/><line x1="17" y1="15" x2="17.01" y2="15" strokeLinecap="round" strokeWidth="3"/></svg>,
  Bell:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  X:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Edit:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>,
  Trash:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Upload:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  Send:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>,
  Back:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15,18 9,12 15,6"/></svg>,
  Check:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20,6 9,17 4,12"/></svg>,
  File:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  Warn:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

/* ══════════════════════════════════════════════════════════
   SCORE RING
══════════════════════════════════════════════════════════ */
function ScoreRing({score,sz=88}){
  const r=(sz-10)/2,circ=2*Math.PI*r;
  const off=circ-(score/100)*circ;
  const cl=score>=70?"var(--gn)":score>=45?"var(--or)":"var(--rd)";
  const lbl=score>=70?"BUENA":score>=45?"REGULAR":"CRÍTICA";
  return(
    <div className="ring" style={{width:sz,height:sz}}>
      <svg width={sz} height={sz} style={{transform:"rotate(-90deg)",position:"absolute"}}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7}/>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={cl} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1s ease",filter:`drop-shadow(0 0 7px ${cl})`}}/>
      </svg>
      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{fontSize:22,fontWeight:900,color:cl,fontFamily:"var(--fn)"}}>{score}</div>
        <div style={{fontSize:8,color:"var(--m)",fontWeight:800,letterSpacing:".08em"}}>{lbl}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function Toast({msg,type="success",onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  const cl={success:"var(--gn)",error:"var(--rd)",info:"var(--tl)",warning:"var(--or)"}[type];
  const ic={success:"✓",error:"✕",info:"ℹ",warning:"⚠"}[type];
  return(
    <div className="toast">
      <div style={{width:26,height:26,borderRadius:"50%",background:`${cl}18`,border:`1px solid ${cl}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:cl,fontWeight:800,flexShrink:0}}>{ic}</div>
      <span style={{fontSize:13,fontWeight:500,flex:1}}>{msg}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHART TOOLTIP
══════════════════════════════════════════════════════════ */
const CTip=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"var(--bg2)",border:"1px solid var(--b2)",borderRadius:11,padding:"8px 12px",fontFamily:"var(--fn)"}}>
      <p style={{fontSize:10,color:"var(--m)",marginBottom:5,fontWeight:700}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{fontSize:13,fontWeight:700,color:p.color||"var(--tl)"}}>{COP(p.value)}</p>)}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════════════════ */
function HomeScreen({cards,txns,setScreen,alerts,loadDemo}){
  const now=new Date(),thisM=MK(now.toISOString());
  const mTxns=txns.filter(t=>MK(t.date)===thisM);
  const totalDebt=cards.reduce((s,c)=>s+txns.filter(t=>t.cardId===c.id).reduce((a,t)=>a+t.amount,0),0);
  const totalLimit=cards.reduce((s,c)=>s+c.limit,0);
  const mSpend=mTxns.reduce((s,t)=>s+t.amount,0);
  const score=ML.health(cards,txns);
  const riskMin=ML.riskMin(cards,txns);
  const predicted=ML.predictEnd(txns);
  const monthly=ML.monthlyData(txns,6);
  const preds=ML.predict(monthly.map(m=>m.total),3);
  const predData=[...monthly,...preds.map((v,i)=>{const d=new Date(now.getFullYear(),now.getMonth()+1+i,1);return{mes:MNAMES[d.getMonth()]+"*",total:v,isPred:true};})];
  const recent=[...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const activeAlerts=alerts.filter(a=>!a.dismissed);
  const op=PCT(totalDebt,totalLimit);
  const rc=op>80?"var(--rd)":op>60?"var(--or)":"var(--tl)";

  return(
    <div className="scr fadeIn">
      {/* Header */}
      <div className="hdr">
        <div>
          <p className="lbl" style={{marginBottom:3}}>OVERVIEW</p>
          <h1 className="h1">Dashboard</h1>
        </div>
        <button className="btn bi" style={{position:"relative"}} onClick={()=>setScreen("alerts")}>
          <IC.Bell style={{width:18,height:18}}/>
          {activeAlerts.length>0&&<span className="badge">{activeAlerts.length}</span>}
        </button>
      </div>

      {/* KPI hero */}
      <div className="hero-kpi">
        <div style={{position:"absolute",top:-60,right:-50,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${rc}0f,transparent)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,position:"relative",flexWrap:"wrap",gap:12}}>
          <div style={{flex:1,minWidth:180}}>
            <p className="lbl" style={{marginBottom:5}}>DEUDA TOTAL</p>
            <div style={{fontSize:"clamp(26px,4vw,34px)",fontWeight:900,color:rc,letterSpacing:"-.03em"}}>{COP(totalDebt)}</div>
            <p style={{fontSize:11,color:"var(--m)",marginTop:4}}>de {COP(totalLimit)} · {op}% usado</p>
          </div>
          <ScoreRing score={score} sz={82}/>
        </div>
        <div className="g3">
          {[
            {lb:"ESTE MES",v:COP(mSpend),cl:"var(--t)"},
            {lb:"PRED. ML",v:COP(predicted),cl:predicted>mSpend*1.15?"var(--rd)":"var(--tl)"},
            {lb:"RIESGO MÍN",v:`${riskMin}%`,cl:riskMin>60?"var(--rd)":riskMin>35?"var(--or)":"var(--gn)"},
          ].map(m=>(
            <div key={m.lb} style={{background:"rgba(0,0,0,.4)",borderRadius:11,padding:"9px 11px"}}>
              <p style={{fontSize:8,color:"var(--m)",fontWeight:800,letterSpacing:".09em",marginBottom:4}}>{m.lb}</p>
              <p style={{fontSize:13,fontWeight:800,color:m.cl}}>{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk alert */}
      {riskMin>55&&(
        <div className="mx-m" style={{padding:"11px 14px",borderRadius:14,background:"var(--vib)",border:"1px solid var(--vibr)",display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer"}} onClick={()=>setScreen("copiloto")}>
          <span style={{fontSize:18}}>🤖</span>
          <div style={{flex:1}}>
            <p style={{fontSize:11,fontWeight:800,color:"var(--vi)",marginBottom:2}}>IA · RIESGO DETECTADO</p>
            <p style={{fontSize:11,color:"#c4b5fd",lineHeight:1.4}}>Prob. {riskMin}% de pagar solo el mínimo. Predicción ML: {COP(predicted)} este mes. Toca para plan de acción.</p>
          </div>
        </div>
      )}

      {/* Alert strip */}
      {activeAlerts.slice(0,1).map(a=>(
        <div key={a.id} className="mx-m" style={{padding:"11px 14px",borderRadius:13,background:a.type==="danger"?"var(--rdb)":"var(--orb)",border:`1px solid ${a.type==="danger"?"var(--rdbr)":"var(--orbr)"}`,display:"flex",gap:9,cursor:"pointer"}} onClick={()=>setScreen("alerts")}>
          <span style={{fontSize:16}}>{a.icon}</span>
          <div style={{flex:1}}>
            <p style={{fontSize:12,fontWeight:700,color:a.type==="danger"?"var(--rd)":"var(--or)"}}>{a.title}</p>
            <p style={{fontSize:11,color:"var(--m)",lineHeight:1.4,marginTop:2}}>{a.body}</p>
          </div>
          {activeAlerts.length>1&&<span style={{fontSize:10,color:"var(--m)",padding:"2px 7px",background:"rgba(255,255,255,0.06)",borderRadius:100,alignSelf:"center",fontWeight:700}}>+{activeAlerts.length-1}</span>}
        </div>
      ))}

      {/* Cards */}
      <div className="sec">
        <p className="lbl">MIS TARJETAS</p>
        <button className="btn bg" onClick={()=>setScreen("cards")}>Gestionar</button>
      </div>
      {cards.length>0?(
        <div className="hs cards-row cards-grid">
          {cards.map(c=><CCVis key={c.id} card={c} txns={txns}/>)}
        </div>
      ):(
        <div className="mx-b" style={{padding:28,borderRadius:18,background:"var(--bg2)",border:"2px dashed var(--b2)",textAlign:"center"}}>
          <IC.Card style={{width:44,height:44,color:"var(--m)",margin:"0 auto 12px",display:"block"}}/>
          <p style={{fontSize:12,color:"var(--m)",marginBottom:12}}>Sin tarjetas registradas</p>
          <button className="btn bp" style={{width:"auto",padding:"10px 18px",fontSize:13,marginBottom:8}} onClick={()=>setScreen("cards")}>Agregar tarjeta</button>
          {loadDemo&&<button className="btn bs" style={{width:"auto",padding:"10px 18px",fontSize:12}} onClick={loadDemo}>Cargar datos de demostración</button>}
        </div>
      )}

      {/* ML chart */}
      <div className="dash-split">
      <div>
      <div className="sec">
        <p className="lbl">TENDENCIA + ML</p>
        <span className="pill ptl" style={{fontSize:9}}>predicción →</span>
      </div>
      <div className="chart-box">
        <div className="chart-h">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={predData} margin={{top:4,right:4,left:0,bottom:0}}>
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00dfc8" stopOpacity={.18}/>
                <stop offset="100%" stopColor="#00dfc8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="mes" tick={{fill:"#475569",fontSize:10,fontFamily:"var(--fn)"}} axisLine={false} tickLine={false}/>
            <YAxis hide/>
            <Tooltip content={<CTip/>}/>
            <Area type="monotone" dataKey="total" stroke="#00dfc8" strokeWidth={2} fill="url(#ag)"
              dot={props=>{const{cx,cy,payload}=props;return <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={payload.isPred?6:3.5} fill={payload.isPred?"#9b6fff":"#00dfc8"} stroke="var(--bg)" strokeWidth={2}/>;}}
              strokeDasharray="0"/>
          </AreaChart>
        </ResponsiveContainer>
        </div>
        <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:4,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:3,background:"#00dfc8",borderRadius:2}}/><span style={{fontSize:9,color:"var(--m)",fontWeight:700}}>Real</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:"50%",background:"#9b6fff"}}/><span style={{fontSize:9,color:"var(--m)",fontWeight:700}}>Predicción ML</span></div>
        </div>
      </div>
      </div>

      {/* Recent txns */}
      <div>
      <div className="sec">
        <p className="lbl">ÚLTIMOS MOVIMIENTOS</p>
        <button className="btn bg" onClick={()=>setScreen("registrar")}>Ver todos</button>
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        {recent.length===0?<div style={{padding:24,textAlign:"center"}}><p style={{fontSize:12,color:"var(--m)"}}>Sin movimientos aún</p></div>:recent.map(t=>{
          const card=cards.find(c=>c.id===t.cardId);
          return(
            <div key={t.id} className="row">
              <div style={{width:40,height:40,borderRadius:12,background:`${CAT_CL[t.cat]||"#888"}16`,border:`1px solid ${CAT_CL[t.cat]||"#888"}26`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{CAT_IC[t.cat]||"📦"}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</p>
                <p style={{fontSize:10,color:"var(--m)",marginTop:2}}>{card?`${card.franchise} ····${card.last4}`:"—"} · {FD(t.date)}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{fontSize:14,fontWeight:800,color:"var(--rd)"}}>−{COP(t.amount)}</p>
                {t.cuotas>1&&<span className="pill pvi" style={{fontSize:9}}>{t.cuotaNum}/{t.cuotas}</span>}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARDS SCREEN
══════════════════════════════════════════════════════════ */
function CardsScreen({cards,setCards,setTxns,txns,toast}){
  const[modal,setModal]=useState(null);
  const ef={bank:"Bancolombia",franchise:"Visa",name:"",last4:"",limit:"",cutDay:"22",payDay:"7",holder:"",theme:"teal"};
  const[form,setForm]=useState(ef);
  const f=k=>({value:form[k],onChange:e=>setForm(p=>({...p,[k]:e.target.value}))});

  const openAdd=()=>{setForm(ef);setModal("add");};
  const openEdit=c=>{setForm({bank:c.bank,franchise:c.franchise,name:c.name||"",last4:c.last4,limit:String(c.limit),cutDay:String(c.cutDay),payDay:String(c.payDay),holder:c.holder||"",theme:c.theme||"teal"});setModal(c);};
  const save=()=>{
    if(form.last4.length!==4||!form.limit){toast("Completa últimos 4 dígitos y cupo","error");return;}
    const data={bank:form.bank,franchise:form.franchise,name:form.name||form.franchise,last4:form.last4,limit:+form.limit,cutDay:+form.cutDay,payDay:+form.payDay,holder:form.holder.toUpperCase()||"SU NOMBRE",theme:form.theme};
    if(modal==="add"){setCards(p=>[...p,{...data,id:UID()}]);toast("✓ Tarjeta agregada");}
    else{setCards(p=>p.map(c=>c.id===modal.id?{...c,...data}:c));toast("✓ Cambios guardados");}
    setModal(null);
  };
  const del=id=>{if(!confirm("¿Eliminar esta tarjeta y todos sus movimientos?"))return;setCards(p=>p.filter(c=>c.id!==id));setTxns(p=>p.filter(t=>t.cardId!==id));toast("Tarjeta y movimientos eliminados");setModal(null);};

  const prev={id:"__p",...{bank:form.bank,franchise:form.franchise,name:form.name||"NOMBRE",last4:form.last4||"0000",limit:+form.limit||1000000,theme:form.theme,holder:form.holder||"SU NOMBRE",cutDay:+form.cutDay||22,payDay:+form.payDay||7}};

  return(
    <div className="scr fadeIn">
      <div className="hdr">
        <div><p className="lbl" style={{marginBottom:3}}>GESTIÓN</p><h1 className="h1">Tarjetas</h1></div>
        <button className="btn bp" style={{width:"auto",padding:"10px 16px",fontSize:13}} onClick={openAdd}><IC.Plus style={{width:16,height:16}}/>Nueva</button>
      </div>
      {cards.length===0?(
        <div style={{padding:"50px 20px",textAlign:"center"}}>
          <IC.Card style={{width:52,height:52,color:"var(--m)",margin:"0 auto 16px",display:"block"}}/>
          <p className="h3" style={{marginBottom:8}}>Sin tarjetas</p>
          <p style={{fontSize:12,color:"var(--m)",marginBottom:20}}>Agrega tu primera tarjeta de crédito</p>
          <button className="btn bp" onClick={openAdd}>Agregar tarjeta</button>
        </div>
      ):(
      <div className="cards-page-grid">
      {cards.map(card=>{
        const used=txns.filter(t=>t.cardId===card.id).reduce((s,t)=>s+t.amount,0);
        const minP=Math.max(Math.round(used*0.05),50000);
        const now=new Date();let dp=card.payDay-now.getDate();if(dp<0)dp+=30;
        return(
          <div key={card.id} className="card-entry">
            <CCVis card={card} txns={txns} noAnim/>
            <div className="g3" style={{marginTop:10}}>
              {[{lb:"Pago mínimo",v:COP(minP),cl:"var(--or)"},{lb:"Pago total",v:COP(used),cl:"var(--tl)"},{lb:`Vence en ${dp}d`,v:`Día ${card.payDay}`,cl:dp<=3?"var(--rd)":"var(--d)"}]
                .map(m=><div key={m.lb} className="card3"><p style={{fontSize:9,color:"var(--m)",fontWeight:800,letterSpacing:".08em",marginBottom:4}}>{m.lb.toUpperCase()}</p><p style={{fontSize:13,fontWeight:800,color:m.cl}}>{m.v}</p></div>)}
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn bs" style={{flex:1}} onClick={()=>openEdit(card)}><IC.Edit style={{width:14,height:14}}/>Editar</button>
              <button className="btn br" onClick={()=>del(card.id)}><IC.Trash style={{width:14,height:14}}/></button>
            </div>
          </div>
        );
      })}
      </div>
      )}

      {modal&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="sh">
            <div className="hdl"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 className="h2">{modal==="add"?"Nueva tarjeta":"Editar tarjeta"}</h2>
              <button className="btn bi" onClick={()=>setModal(null)}><IC.X style={{width:16,height:16}}/></button>
            </div>
            {/* Live preview */}
            <div style={{marginBottom:18}}><CCVis card={prev} txns={[]} noAnim/></div>
            {/* Theme */}
            <div style={{marginBottom:16}}>
              <label className="ilbl">TEMA DE TARJETA</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {TKEYS.map(tk=>{const t=THEMES[tk];return(
                  <div key={tk} onClick={()=>setForm(p=>({...p,theme:tk}))} style={{width:48,height:30,borderRadius:8,background:t.bg,cursor:"pointer",border:form.theme===tk?`2px solid ${t.acc}`:"2px solid transparent",transition:"border .15s",boxShadow:form.theme===tk?`0 0 12px ${t.acc}44`:"none"}}/>
                );})}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label className="ilbl">BANCO</label><select className="inp" {...f("bank")}>{BANKS.map(b=><option key={b}>{b}</option>)}</select></div>
              <div className="g2">
                <div><label className="ilbl">FRANQUICIA</label><select className="inp" {...f("franchise")}>{FRAN.map(fr=><option key={fr}>{fr}</option>)}</select></div>
                <div><label className="ilbl">NOMBRE</label><input className="inp" placeholder="Gold, Infinite…" {...f("name")}/></div>
              </div>
              <div><label className="ilbl">TITULAR</label><input className="inp" placeholder="JUAN PÉREZ" {...f("holder")}/></div>
              <div className="g2">
                <div><label className="ilbl">4 ÚLTIMOS DÍGITOS *</label><input className="inp" placeholder="0000" maxLength={4} {...f("last4")}/></div>
                <div><label className="ilbl">CUPO TOTAL (COP) *</label><input className="inp" type="number" placeholder="10000000" {...f("limit")}/></div>
              </div>
              <div className="g2">
                <div><label className="ilbl">DÍA CORTE</label><input className="inp" type="number" min={1} max={31} {...f("cutDay")}/></div>
                <div><label className="ilbl">DÍA PAGO LÍMITE</label><input className="inp" type="number" min={1} max={31} {...f("payDay")}/></div>
              </div>
              <button className="btn bp" style={{marginTop:4}} onClick={save}>{modal==="add"?"Agregar tarjeta":"Guardar cambios"}</button>
              {modal!=="add"&&<button className="btn br" onClick={()=>del(modal.id)}>Eliminar tarjeta</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REGISTER / IMPORT SCREEN
══════════════════════════════════════════════════════════ */
function RegisterScreen({cards,txns,setTxns,toast}){
  const[tab,setTab]=useState("import");
  const[form,setForm]=useState({name:"",amount:"",cat:"Restaurantes",cardId:cards[0]?.id||"",date:TODAY(),cuotas:"1",note:""});
  const[editTxn,setEditTxn]=useState(null);
  const[editForm,setEditForm]=useState(null);
  const[dragOver,setDragOver]=useState(false);
  const[parsing,setParsing]=useState(false);
  const[parseRes,setParseRes]=useState([]);
  const[pending,setPending]=useState([]);
  const[selCard,setSelCard]=useState(cards[0]?.id||"");
  const fileRef=useRef(null);
  const f=k=>({value:form[k],onChange:e=>setForm(p=>({...p,[k]:e.target.value}))});

  const handleFiles=async files=>{
    const arr=Array.from(files||[]);
    if(!arr.length) return;
    if(!selCard && cards.length>0){toast("Selecciona una tarjeta primero","error");return;}
    if(cards.length===0){toast("Agrega una tarjeta primero","error");return;}
    const cardId = selCard || cards[0]?.id;
    setParsing(true);setParseRes([]);setPending([]);
    const results=[];const allTxns=[];
    for(const file of arr){
      try{
        const r=await FP.parse(file, cardId);
        results.push({
          name:file.name,
          ext:file.name.split(".").pop().toUpperCase(),
          size:(file.size/1024).toFixed(1),
          count:r.count,
          err:r.err||null
        });
        allTxns.push(...(r.txns||[]));
      }catch(e){
        results.push({name:file.name,ext:"?",size:"?",count:0,err:e.message});
      }
    }
    setParseRes(results);setPending(allTxns);setParsing(false);
    if(allTxns.length) toast(`${allTxns.length} movimiento${allTxns.length===1?"":"s"} detectado${allTxns.length===1?"":"s"}. Revisa y confirma.`,"info");
    else toast("No se detectaron movimientos. Verifica el formato del archivo.","warning");
  };

  const onInputChange = e => {
    if(e.target.files && e.target.files.length > 0){
      handleFiles(e.target.files);
      // Reset so same file can be re-selected
      e.target.value = "";
    }
  };

  const confirmImport=()=>{
    if(!pending.length) return;
    setTxns(p=>[...p,...pending]);
    toast(`✓ ${pending.length} movimientos importados`);
    setParseRes([]);setPending([]);
  };

  const saveTxn=()=>{
    if(!form.name||!form.amount||!form.cardId){toast("Nombre, monto y tarjeta son obligatorios","error");return;}
    const amt=+form.amount;if(isNaN(amt)||amt<=0){toast("Monto inválido","error");return;}
    const cu=Math.max(1,+form.cuotas||1);
    const rows=[];
    for(let i=1;i<=cu;i++){
      const d=new Date(form.date+"T12:00:00");d.setMonth(d.getMonth()+(i-1));
      rows.push({id:UID(),name:form.name,amount:Math.round(amt/cu),cat:form.cat,cardId:form.cardId,date:d.toISOString().split("T")[0],cuotas:cu,cuotaNum:i,note:form.note});
    }
    setTxns(p=>[...p,...rows]);
    toast(cu>1?`✓ ${cu} cuotas registradas`:"✓ Gasto registrado");
    setForm({name:"",amount:"",cat:"Restaurantes",cardId:cards[0]?.id||"",date:TODAY(),cuotas:"1",note:""});
  };

  const delTxn=id=>{setTxns(p=>p.filter(t=>t.id!==id));toast("Movimiento eliminado");};
  const openEdit=t=>{setEditTxn(t);setEditForm({name:t.name,amount:String(t.amount),cat:t.cat,cardId:t.cardId,date:t.date,cuotas:String(t.cuotas||1),note:t.note||""});};
  const saveEdit=()=>{
    if(!editForm?.name||!editForm?.amount||!editForm?.cardId){toast("Nombre, monto y tarjeta son obligatorios","error");return;}
    const amt=+editForm.amount;if(isNaN(amt)||amt<=0){toast("Monto inválido","error");return;}
    setTxns(p=>p.map(t=>t.id===editTxn.id?{...t,name:editForm.name,amount:amt,cat:editForm.cat,cardId:editForm.cardId,date:editForm.date,cuotas:+editForm.cuotas||1,note:editForm.note}:t));
    toast("✓ Movimiento actualizado");setEditTxn(null);setEditForm(null);
  };
  const ef=k=>({value:editForm?.[k]||"",onChange:e=>setEditForm(p=>({...p,[k]:e.target.value}))});
  const sorted=[...txns].sort((a,b)=>new Date(b.date)-new Date(a.date));

  return(
    <div className="scr fadeIn">
      {/*
        FILE INPUT: rendered at top level of component, OUTSIDE drop zone and any
        overflow:hidden container. Uses <label> pattern — 100% reliable cross-browser.
      */}
      <div className="page-pad">
        <p className="lbl" style={{marginBottom:3}}>GASTOS</p>
        <h1 className="h1">Registrar</h1>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {[["import","📤 Importar"],["manual","✏️ Manual"],["list","📋 Historial"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} className={`tab-btn${tab===id?" on":""}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ────── IMPORT ────── */}
      {tab==="import"&&(
        <div className="px">
          {/* Card selector */}
          <div style={{marginBottom:16}}>
            <label className="ilbl" htmlFor="card-sel-imp">ASIGNAR MOVIMIENTOS A TARJETA</label>
            <select id="card-sel-imp" className="inp" value={selCard} onChange={e=>setSelCard(e.target.value)}>
              {cards.length===0
                ?<option value="">— Agrega una tarjeta primero —</option>
                :cards.map(c=><option key={c.id} value={c.id}>{c.bank} {c.franchise} ····{c.last4}</option>)}
            </select>
          </div>

          {/* ── UPLOAD BUTTON: input opacity:0 sobre el botón (funciona en sandbox) ── */}
          <div
            style={{
              position:"relative",
              background: cards.length===0 ? "var(--bg3)" : "linear-gradient(135deg,var(--tl),var(--tl2))",
              borderRadius:16,
              padding:"18px 20px",
              textAlign:"center",
              marginBottom:14,
              boxShadow: cards.length===0 ? "none" : "0 4px 20px rgba(0,223,200,0.2)",
              overflow:"hidden",
              opacity: cards.length===0 ? 0.5 : 1,
              transition:"all .2s",
            }}
          >
            {/* Input transparente que cubre todo el botón */}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.txt,.md"
              disabled={cards.length===0||parsing}
              onChange={onInputChange}
              style={{
                position:"absolute",
                inset:0,
                width:"100%",
                height:"100%",
                opacity:0,
                cursor: cards.length===0 ? "not-allowed" : "pointer",
                zIndex:2,
              }}
            />
            {/* Contenido visual del botón (debajo del input) */}
            <div style={{position:"relative",zIndex:1,pointerEvents:"none"}}>
              {parsing ? (
                <>
                  <div style={{width:28,height:28,borderRadius:"50%",border:"3px solid #001814",borderTopColor:"transparent",margin:"0 auto 8px",animation:"sp .75s linear infinite"}}/>
                  <p style={{fontSize:15,fontWeight:800,color: cards.length===0?"var(--s)":"#001814"}}>Analizando…</p>
                </>
              ) : (
                <>
                  <IC.Upload style={{width:26,height:26,color: cards.length===0?"var(--s)":"#001814",margin:"0 auto 8px",display:"block"}}/>
                  <p style={{fontSize:15,fontWeight:800,color: cards.length===0?"var(--s)":"#001814",marginBottom:3}}>
                    {cards.length===0 ? "Agrega una tarjeta primero" : "Seleccionar archivo(s)"}
                  </p>
                  <p style={{fontSize:11,color: cards.length===0?"var(--m)":"rgba(0,24,20,0.6)",fontWeight:600}}>
                    Excel · CSV · PDF · Word · TXT
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Drop zone (supplementary — drag works here) */}
          <div
            className={`dz${dragOver?" ov2":""}`}
            style={{marginBottom:16}}
            onDragOver={e=>{e.preventDefault();e.stopPropagation();setDragOver(true);}}
            onDragLeave={e=>{e.preventDefault();setDragOver(false);}}
            onDrop={e=>{e.preventDefault();e.stopPropagation();setDragOver(false);handleFiles(e.dataTransfer.files);}}
          >
            {parsing?(
              <div>
                <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid var(--tl)",borderTopColor:"transparent",margin:"0 auto 12px",animation:"sp .75s linear infinite"}}/>
                <p style={{fontSize:14,fontWeight:700,marginBottom:4}}>Analizando archivo…</p>
                <p style={{fontSize:12,color:"var(--m)"}}>Detectando transacciones automáticamente</p>
              </div>
            ):(
              <>
                <p style={{fontSize:13,fontWeight:600,color:"var(--s)",marginBottom:4}}>
                  {dragOver?"📂 Suelta aquí para importar":"🖱️ O arrastra archivos a esta zona"}
                </p>
                <p style={{fontSize:11,color:"var(--m)"}}>Banco de Colombia · Davivienda · BBVA y más</p>
              </>
            )}
          </div>

          {/* Resultados del parsing */}
          {parseRes.length>0&&(
            <div style={{marginTop:4}}>
              <p className="lbl" style={{marginBottom:10}}>RESULTADO DEL ANÁLISIS</p>
              {parseRes.map((r,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"11px 13px",borderRadius:12,background:r.count>0?"var(--gnb)":"var(--rdb)",border:`1px solid ${r.count>0?"var(--gnbr)":"var(--rdbr)"}`,marginBottom:8,alignItems:"center"}}>
                  <IC.File style={{width:20,height:20,color:r.count>0?"var(--gn)":"var(--rd)",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</p>
                    <p style={{fontSize:10,color:"var(--m)"}}>
                      {r.size} KB · {r.count} movimiento{r.count!==1?"s":""} detectado{r.count!==1?"s":""}
                      {r.err&&<span style={{color:"var(--or)"}}> · ⚠ {r.err.slice(0,50)}</span>}
                    </p>
                  </div>
                  <span className={`pill ${r.count>0?"pgn":"prd"}`}>{r.count>0?`✓ ${r.count}`:"0"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview de los movimientos pendientes */}
          {pending.length>0&&(
            <div style={{marginTop:16}}>
              <p className="lbl" style={{marginBottom:10}}>VISTA PREVIA — {pending.length} MOVIMIENTOS</p>
              <div className="card" style={{padding:0,overflow:"hidden",marginBottom:12,maxHeight:300,overflowY:"auto"}}>
                {pending.slice(0,30).map((t,i)=>(
                  <div key={i} className="row" style={{padding:"10px 14px"}}>
                    <div style={{width:32,height:32,borderRadius:9,background:`${CAT_CL[t.cat]}16`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{CAT_IC[t.cat]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</p>
                      <p style={{fontSize:10,color:"var(--m)"}}>{t.cat} · {FD(t.date)}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <p style={{fontSize:13,fontWeight:700,color:"var(--rd)"}}>−{COP(t.amount)}</p>
                      <select
                        value={t.cat}
                        onChange={e=>{const nc=e.target.value;setPending(pp=>pp.map((tx,j)=>j===i?{...tx,cat:nc}:tx));}}
                        style={{fontSize:10,background:"var(--bg3)",border:"1px solid var(--b2)",color:"var(--d)",borderRadius:6,padding:"3px 5px",cursor:"pointer",fontFamily:"var(--fn)"}}
                      >
                        {CATS.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {pending.length>30&&<div style={{padding:"10px 14px",textAlign:"center"}}><p style={{fontSize:11,color:"var(--m)"}}>+{pending.length-30} movimientos más…</p></div>}
              </div>
              <button className="btn bp" onClick={confirmImport}>
                Confirmar e importar {pending.length} movimiento{pending.length!==1?"s":""}
              </button>
              <button className="btn bs" style={{width:"100%",marginTop:8}} onClick={()=>{setPending([]);setParseRes([]);}}>
                Descartar todo
              </button>
            </div>
          )}

          {/* Guía de formatos */}
          {!parseRes.length&&!parsing&&(
            <div style={{marginTop:8}}>
              <p className="lbl" style={{marginBottom:12}}>ESTRUCTURA RECOMENDADA</p>
              <div className="g4">
                {[
                  ["📊","Excel / CSV","Columnas: Fecha · Descripción · Valor. Se auto-detectan."],
                  ["📑","PDF","Extractos bancarios — se extraen montos y nombres."],
                  ["📄","Word (.docx)","Tablas o listas: Nombre – $monto por línea."],
                  ["📝","Notas (.txt)","Una transacción por línea: Comercio - $monto."],
                ].map(([ic,n,d])=>(
                  <div key={n} onClick={()=>fileRef.current&&fileRef.current.click()} className="card3" style={{cursor:cards.length===0?"not-allowed":"pointer"}}>
                    <p style={{fontSize:20,marginBottom:6}}>{ic}</p>
                    <p style={{fontSize:11,fontWeight:700,marginBottom:3}}>{n}</p>
                    <p style={{fontSize:10,color:"var(--m)",lineHeight:1.4}}>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────── MANUAL ────── */}
      {tab==="manual"&&(
        <div className="px">
          {cards.length===0?(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <IC.Card style={{width:44,height:44,color:"var(--m)",margin:"0 auto 14px",display:"block"}}/>
              <p className="h3" style={{marginBottom:8}}>Agrega una tarjeta primero</p>
              <p style={{fontSize:12,color:"var(--m)"}}>Ve a Tarjetas para configurar la primera</p>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="ilbl">COMERCIO / DESCRIPCIÓN *</label><input className="inp" placeholder="Ej: Restaurante El Corral" {...f("name")}/></div>
              <div className="g2">
                <div><label className="ilbl">MONTO (COP) *</label><input className="inp" type="number" placeholder="89000" {...f("amount")}/></div>
                <div><label className="ilbl">CUOTAS</label><select className="inp" {...f("cuotas")}>{[1,2,3,6,9,12,18,24,36,48].map(n=><option key={n} value={n}>{n===1?"Contado":`${n} cuotas`}</option>)}</select></div>
              </div>
              <div className="g2">
                <div><label className="ilbl">CATEGORÍA</label><select className="inp" {...f("cat")}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="ilbl">TARJETA *</label><select className="inp" {...f("cardId")}>{cards.map(c=><option key={c.id} value={c.id}>{c.franchise} ····{c.last4}</option>)}</select></div>
              </div>
              <div><label className="ilbl">FECHA</label><input className="inp" type="date" {...f("date")}/></div>
              <div><label className="ilbl">NOTA</label><input className="inp" placeholder="Referencia adicional…" {...f("note")}/></div>
              {+form.cuotas>1&&+form.amount>0&&(
                <div style={{padding:13,borderRadius:12,background:"var(--vib)",border:"1px solid var(--vibr)"}}>
                  <p style={{fontSize:10,fontWeight:800,color:"var(--vi)",marginBottom:4}}>DISTRIBUCIÓN DE CUOTAS</p>
                  <p style={{fontSize:13,fontWeight:700,color:"#c4b5fd"}}>{form.cuotas} cuotas de {COP(Math.round(+form.amount/+form.cuotas))}</p>
                  <p style={{fontSize:11,color:"var(--m)",marginTop:2}}>Total: {COP(+form.amount)}</p>
                </div>
              )}
              <button className="btn bp" onClick={saveTxn}>{+form.cuotas>1?`Registrar ${form.cuotas} cuotas`:"Registrar gasto"}</button>
            </div>
          )}
        </div>
      )}

      {/* ────── HISTORIAL ────── */}
      {tab==="list"&&(
        <div>
          {sorted.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px"}}>
              <p style={{fontSize:44,marginBottom:14}}>📋</p>
              <p className="h3" style={{marginBottom:6}}>Sin movimientos</p>
              <p style={{fontSize:12,color:"var(--m)"}}>Importa o registra tu primer gasto</p>
            </div>
          ):(
            <div className="card" style={{margin:"0 20px",padding:0,overflow:"hidden"}}>
              {sorted.map(t=>{
                const card=cards.find(c=>c.id===t.cardId);
                return(
                  <div key={t.id} className="row">
                    <div style={{width:38,height:38,borderRadius:11,background:`${CAT_CL[t.cat]||"#888"}16`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{CAT_IC[t.cat]||"📦"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</p>
                      <p style={{fontSize:10,color:"var(--m)",marginTop:1}}>{card?`····${card.last4}`:"—"} · {FD(t.date)}{t.cuotas>1?` · ${t.cuotaNum}/${t.cuotas}`:""}</p>
                    </div>
                    <p style={{fontSize:13,fontWeight:700,color:"var(--rd)",flexShrink:0,marginRight:8}}>−{COP(t.amount)}</p>
                    <button className="btn bi" style={{width:30,height:30,borderRadius:8,flexShrink:0,marginRight:4}} onClick={()=>openEdit(t)}><IC.Edit style={{width:13,height:13}}/></button>
                    <button className="btn bi" style={{width:30,height:30,borderRadius:8,flexShrink:0}} onClick={()=>delTxn(t.id)}><IC.Trash style={{width:13,height:13}}/></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {editTxn&&editForm&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&(setEditTxn(null),setEditForm(null))}>
          <div className="sh">
            <div className="hdl"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 className="h2">Editar movimiento</h2>
              <button className="btn bi" onClick={()=>{setEditTxn(null);setEditForm(null);}}><IC.X style={{width:16,height:16}}/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div><label className="ilbl">COMERCIO *</label><input className="inp" {...ef("name")}/></div>
              <div className="g2">
                <div><label className="ilbl">MONTO *</label><input className="inp" type="number" {...ef("amount")}/></div>
                <div><label className="ilbl">CUOTAS</label><input className="inp" type="number" min="1" {...ef("cuotas")}/></div>
              </div>
              <div className="g2">
                <div><label className="ilbl">CATEGORÍA</label><select className="inp" {...ef("cat")}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="ilbl">TARJETA *</label><select className="inp" {...ef("cardId")}>{cards.map(c=><option key={c.id} value={c.id}>{c.franchise} ····{c.last4}</option>)}</select></div>
              </div>
              <div><label className="ilbl">FECHA</label><input className="inp" type="date" {...ef("date")}/></div>
              <div><label className="ilbl">NOTA</label><input className="inp" {...ef("note")}/></div>
              <button className="btn bp" onClick={saveEdit}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function AnalyticsScreen({cards,txns}){
  const[view,setView]=useState("overview");
  const now=new Date(),thisM=MK(now.toISOString());
  const mTxns=txns.filter(t=>MK(t.date)===thisM);
  const mTotal=mTxns.reduce((s,t)=>s+t.amount,0);
  const totalDebt=cards.reduce((s,c)=>s+txns.filter(t=>t.cardId===c.id).reduce((a,t)=>a+t.amount,0),0);
  const totalLimit=cards.reduce((s,c)=>s+c.limit,0);
  const score=ML.health(cards,txns);
  const monthly=useMemo(()=>ML.monthlyData(txns,6),[txns]);
  const predicted=ML.predictEnd(txns);
  const riskMin=ML.riskMin(cards,txns);
  const hist=monthly.map(m=>m.total);
  const nextP=ML.predict(hist,3);
  const futureData=[...monthly,...nextP.map((v,i)=>{const d=new Date(now.getFullYear(),now.getMonth()+1+i,1);return{mes:MNAMES[d.getMonth()]+"*",total:v,isPred:true};})];

  const catData=CATS.map(cat=>{
    const vals=monthly.map(m=>m[cat]||0);
    const total=vals.reduce((s,v)=>s+v,0);
    if(total===0) return null;
    const{slope}=ML.linReg(vals);
    const next=Math.max(0,ML.predict(vals,1)[0]);
    const anom=ML.anomalies(vals);
    return{cat,total,slope,next,trend:slope>4000?"↑":slope<-4000?"↓":"→",anomaly:anom[anom.length-1]};
  }).filter(Boolean).sort((a,b)=>b.total-a.total);

  const recentAmts=[...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20).map(t=>t.amount);
  const anomFlags=ML.anomalies(recentAmts);
  const anomalies=[...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20).filter((_,i)=>anomFlags[i]);

  return(
    <div className="scr fadeIn">
      <div className="page-pad">
        <p className="lbl" style={{marginBottom:3}}>INTELIGENCIA</p>
        <h1 className="h1">Analítica ML</h1>
      </div>
      {/* Sub-tabs */}
      <div className="hs" style={{padding:"0 20px 16px",gap:8}}>
        {[["overview","📊 Resumen"],["ml","🤖 ML"],["cats","📂 Categorías"],["debt","💸 Deuda"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setView(id)} style={{padding:"8px 14px",borderRadius:100,background:view===id?"var(--tlb)":"var(--bg3)",border:`1px solid ${view===id?"var(--tlbr)":"var(--b1)"}`,color:view===id?"var(--tl)":"var(--s)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--fn)",whiteSpace:"nowrap",transition:"all .15s"}}>
            {lbl}
          </button>
        ))}
      </div>

      {view==="overview"&&(
        <>
          <div className="analytics-pair">
          <div className="mx-m" style={{padding:18,borderRadius:18,background:"var(--bg2)",border:"1px solid var(--b1)"}}>
            <p className="lbl" style={{marginBottom:14}}>SALUD FINANCIERA</p>
            <div style={{display:"flex",gap:18,alignItems:"center",marginBottom:16}}>
              <ScoreRing score={score} sz={92}/>
              <div style={{flex:1}}>
                {[{lb:"Utilización global",v:`${PCT(totalDebt,totalLimit)}%`,ok:PCT(totalDebt,totalLimit)<60},{lb:"Riesgo pago mín.",v:`${riskMin}%`,ok:riskMin<40},{lb:"Tarjetas activas",v:cards.length,ok:true}].map(r=>(
                  <div key={r.lb} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <span style={{fontSize:11,color:"var(--m)"}}>{r.lb}</span>
                    <span style={{fontSize:11,fontWeight:800,color:r.ok?"var(--gn)":"var(--rd)"}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            {cards.map(c=>{const u=txns.filter(t=>t.cardId===c.id).reduce((s,t)=>s+t.amount,0);const p=PCT(u,c.limit);const cl=p>80?"var(--rd)":p>60?"var(--or)":"var(--tl)";return(
              <div key={c.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,fontWeight:600}}>{c.franchise} ····{c.last4}</span><span style={{fontSize:11,fontWeight:700,color:cl}}>{p}% · {COP(u)}</span></div>
                <div className="bt"><div className="bf" style={{width:`${p}%`,background:cl}}/></div>
              </div>
            );})}
          </div>
          <div className="chart-box">
            <p className="lbl" style={{marginBottom:12}}>GASTO MENSUAL</p>
            <div className="chart-h">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{top:4,right:4,left:0,bottom:0}} barSize={28}>
                <XAxis dataKey="mes" tick={{fill:"#475569",fontSize:10,fontFamily:"var(--fn)"}} axisLine={false} tickLine={false}/>
                <YAxis hide/><Tooltip content={<CTip/>}/>
                <Bar dataKey="total" radius={[7,7,0,0]}>{monthly.map((_,i)=><Cell key={i} fill={i===5?"#00dfc8":"rgba(0,223,200,0.25)"}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
          </div>
          {anomalies.length>0&&(
            <div className="mx-m" style={{padding:15,borderRadius:16,background:"var(--orb)",border:"1px solid var(--orbr)"}}>
              <p style={{fontSize:10,fontWeight:800,color:"var(--or)",letterSpacing:".1em",marginBottom:10}}>⚡ ANOMALÍAS DETECTADAS (ML Z-score)</p>
              {anomalies.slice(0,3).map((t,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<2&&i<anomalies.length-1?"1px solid rgba(255,144,64,0.12)":"none"}}>
                  <span style={{fontSize:12}}>{t.name}</span>
                  <span style={{fontSize:12,fontWeight:800,color:"var(--or)"}}>{COP(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view==="ml"&&(
        <>
          <div className="chart-box">
            <p className="lbl" style={{marginBottom:4}}>PROYECCIÓN 3 MESES (regresión lineal)</p>
            <p style={{fontSize:10,color:"var(--m)",marginBottom:12}}>Puntos morados = predicciones ML</p>
            <div className="chart-h">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={futureData} margin={{top:4,right:4,left:0,bottom:0}}>
                <XAxis dataKey="mes" tick={{fill:"#475569",fontSize:10,fontFamily:"var(--fn)"}} axisLine={false} tickLine={false}/>
                <YAxis hide/><Tooltip content={<CTip/>}/>
                <Line type="monotone" dataKey="total" stroke="#00dfc8" strokeWidth={2.5}
                  dot={props=>{const{cx,cy,payload}=props;return <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={payload.isPred?6:4} fill={payload.isPred?"#9b6fff":"#00dfc8"} stroke="var(--bg)" strokeWidth={2}/>;}}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>
          <div className="g4 ml-stats">
            {[
              {ic:"📈",lb:"Fin de mes",v:COP(predicted),n:"Predicción mixta",cl:predicted>mTotal*1.1?"var(--rd)":"var(--tl)"},
              {ic:"🎯",lb:"Riesgo mínimo",v:`${riskMin}%`,n:"Basado en utilización",cl:riskMin>60?"var(--rd)":riskMin>35?"var(--or)":"var(--gn)"},
              {ic:"📉",lb:"Próx. mes pred.",v:COP(nextP[0]||0),n:"Regresión lineal",cl:"var(--vi)"},
              {ic:"⚡",lb:"Anomalías",v:anomalies.length,n:"Z-score > 2.0",cl:anomalies.length>0?"var(--or)":"var(--gn)"},
            ].map(m=>(
              <div key={m.lb} className="card3">
                <p style={{fontSize:22,marginBottom:6}}>{m.ic}</p>
                <p style={{fontSize:16,fontWeight:900,color:m.cl,marginBottom:3}}>{m.v}</p>
                <p style={{fontSize:10,color:"var(--m)",marginBottom:2}}>{m.lb}</p>
                <p style={{fontSize:9,color:"var(--b3)"}}>{m.n}</p>
              </div>
            ))}
          </div>
          <div style={{margin:"0 20px 14px",padding:15,borderRadius:18,background:"var(--bg2)",border:"1px solid var(--b1)"}}>
            <p className="lbl" style={{marginBottom:12}}>PREDICCIÓN POR CATEGORÍA (próximo mes)</p>
            {catData.slice(0,7).map(c=>(
              <div key={c.cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontSize:15,flexShrink:0}}>{CAT_IC[c.cat]}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:600}}>{c.cat}</span>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:10,fontWeight:800,color:c.slope>4000?"var(--rd)":"var(--gn)"}}>{c.trend}</span>
                      <span style={{fontSize:11,fontWeight:700,color:"var(--d)"}}>{COP(c.next)}</span>
                    </div>
                  </div>
                  <div className="bt"><div className="bf" style={{width:`${mTotal>0?Math.min(c.total/mTotal*100,100):0}%`,background:CAT_CL[c.cat]}}/></div>
                </div>
                {c.anomaly&&<span className="pill por" style={{fontSize:8}}>⚡</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {view==="cats"&&(
        <>
          {catData.length===0?(
            <div style={{textAlign:"center",padding:"40px 20px"}}><p style={{fontSize:12,color:"var(--m)"}}>Sin datos de categorías este mes</p></div>
          ):(
            <>
              <div style={{margin:"0 20px 14px",padding:"14px 10px",borderRadius:18,background:"var(--bg2)",border:"1px solid var(--b1)"}}>
                <p className="lbl" style={{marginBottom:12}}>DISTRIBUCIÓN ESTE MES</p>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <ResponsiveContainer width={148} height={148} style={{flexShrink:0}}>
                    <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="total">
                      {catData.map((c,i)=><Cell key={i} fill={CAT_CL[c.cat]}/>)}
                    </Pie><Tooltip content={<CTip/>}/></PieChart>
                  </ResponsiveContainer>
                  <div style={{flex:1}}>
                    {catData.slice(0,6).map(c=>(
                      <div key={c.cat} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:CAT_CL[c.cat],flexShrink:0}}/>
                        <span style={{fontSize:10,flex:1,color:"var(--s)"}}>{c.cat}</span>
                        <span style={{fontSize:10,fontWeight:800}}>{mTotal>0?Math.round(c.total/mTotal*100):0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{padding:"0 20px"}}>
                {catData.map(c=>(
                  <div key={c.cat} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:14}}>{CAT_IC[c.cat]}</span><span style={{fontSize:12,fontWeight:600}}>{c.cat}</span>{c.anomaly&&<span className="pill por" style={{fontSize:8}}>Anómalo</span>}</div>
                      <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:800,color:CAT_CL[c.cat]}}>{COP(c.total)}</span><span style={{fontSize:10,color:c.slope>4000?"var(--rd)":"var(--gn)",marginLeft:5,fontWeight:700}}>{c.trend}</span></div>
                    </div>
                    <div className="bt"><div className="bf" style={{width:`${mTotal>0?Math.min(c.total/mTotal*100,100):0}%`,background:CAT_CL[c.cat]}}/></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {view==="debt"&&(
        <>
          <div style={{margin:"0 20px 14px",padding:18,borderRadius:18,background:"var(--bg2)",border:"1px solid var(--b1)"}}>
            <p className="lbl" style={{marginBottom:14}}>PLANIFICADOR DE PAGO</p>
            {(()=>{
              const monthlyRate=0.024;
              const monthlyPay=Math.max(Math.round(totalDebt*0.15),totalDebt>0?100000:0);
              const estMonths=totalDebt>0?Math.ceil(totalDebt/monthlyPay):0;
              const monthlyInterest=Math.round(totalDebt*monthlyRate);
              return(
            <div className="g2" style={{marginBottom:16}}>
              {[
                {lb:"Deuda total",v:COP(totalDebt),cl:"var(--rd)"},
                {lb:"Interés est. /mes",v:COP(monthlyInterest),cl:"var(--or)"},
                {lb:"Meses estimados",v:totalDebt>0?`${estMonths}`:"0",cl:"var(--tl)"},
                {lb:"Pago sugerido/mes",v:COP(monthlyPay),cl:"var(--gn)"},
              ].map(m=><div key={m.lb} className="card3"><p style={{fontSize:9,color:"var(--m)",fontWeight:800,letterSpacing:".08em",marginBottom:4}}>{m.lb.toUpperCase()}</p><p style={{fontSize:14,fontWeight:900,color:m.cl}}>{m.v}</p></div>)}
            </div>
              );
            })()}
            <p className="lbl" style={{marginBottom:10}}>ESTRATEGIA AVALANCHA</p>
            {cards.map((c,i)=>{const u=txns.filter(t=>t.cardId===c.id).reduce((s,t)=>s+t.amount,0);if(!u)return null;const p=PCT(u,c.limit);const cardRate=u>5000000?0.028:0.022;return(
              <div key={c.id} style={{padding:"11px 0",borderBottom:i<cards.length-1?"1px solid var(--b1)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><span className={`pill ${i===0?"prd":"ptl"}`} style={{fontSize:9}}>#{i+1}</span><span style={{fontSize:12,fontWeight:600}}>{c.franchise} ····{c.last4}</span></div>
                  <span style={{fontSize:12,fontWeight:800,color:p>70?"var(--rd)":"var(--tl)"}}>{COP(u)}</span>
                </div>
                <div className="bt"><div className="bf" style={{width:`${p}%`,background:p>70?"var(--rd)":"var(--tl)"}}/></div>
                <p style={{fontSize:10,color:"var(--m)",marginTop:4}}>Sugerido: {COP(Math.max(Math.round(u*0.2),100000))} · Tasa aprox: {(cardRate*100).toFixed(1)}% EM</p>
              </div>
            );})}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COPILOTO AI
══════════════════════════════════════════════════════════ */
function CopilotoScreen({cards,txns}){
  const[msgs,setMsgs]=useState([{role:"ai",text:"¡Hola! Soy tu **Copiloto Financiero IA** 🤖\n\nAnalizo tus tarjetas y movimientos en tiempo real. Puedo:\n\n• Responder preguntas sobre tu situación financiera\n• Simular compras e impacto en tu cupo\n• Crear planes personalizados de pago\n• Predecir gastos con modelos ML\n• Recomendar qué tarjeta usar\n\n¿Cómo puedo ayudarte hoy?"}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[apiStatus,setApiStatus]=useState("checking");
  const endRef=useRef(null);

  const SUGG=["¿Cuánto debo pagar esta semana?","¿Qué tarjeta conviene para $500K?","Simula $2M a 6 cuotas","Plan para salir de deuda","¿Cuánto gastaré este mes?","Analiza mis anomalías"];

  const ctx=useCallback(()=>{
    const now=new Date(),thisM=MK(now.toISOString());
    const mt=txns.filter(t=>MK(t.date)===thisM);
    const mT=mt.reduce((s,t)=>s+t.amount,0);
    const tD=cards.reduce((s,c)=>s+txns.filter(t=>t.cardId===c.id).reduce((a,t)=>a+t.amount,0),0);
    const tL=cards.reduce((s,c)=>s+c.limit,0);
    const pred=ML.predictEnd(txns);
    const rMin=ML.riskMin(cards,txns);
    const sc=ML.health(cards,txns);
    const lines=cards.map(c=>{const u=txns.filter(t=>t.cardId===c.id).reduce((s,t)=>s+t.amount,0);let dp=c.payDay-now.getDate();if(dp<0)dp+=30;return`- ${c.bank} ${c.franchise} ····${c.last4}: usado $${u.toLocaleString()} / $${c.limit.toLocaleString()} (${PCT(u,c.limit)}%), corte día ${c.cutDay}, pago día ${c.payDay} (en ${dp} días), mín $${Math.max(Math.round(u*0.05),50000).toLocaleString()}`;}).join("\n");
    const topC=CATS.map(cat=>({cat,v:mt.filter(t=>t.cat===cat).reduce((s,t)=>s+t.amount,0)})).filter(c=>c.v>0).sort((a,b)=>b.v-a.v).slice(0,4).map(c=>`${c.cat}: $${c.v.toLocaleString()}`).join(", ");
    return `Eres un experto copiloto financiero para usuarios colombianos. Datos actuales:

TARJETAS (${cards.length}):
${lines||"Sin tarjetas configuradas"}

RESUMEN FINANCIERO:
- Score ML: ${sc}/100
- Deuda total: $${tD.toLocaleString()} COP
- Cupo total: $${tL.toLocaleString()} COP
- Utilización: ${PCT(tD,tL)}%
- Gasto mes actual: $${mT.toLocaleString()} COP
- Predicción ML fin de mes: $${pred.toLocaleString()} COP
- Riesgo pago mínimo: ${rMin}%
- Top categorías mes: ${topC||"sin datos"}
- Fecha hoy: ${now.toLocaleDateString("es-CO")}

Responde en español, sé directo y práctico. Usa pesos colombianos (COP/$). Máximo 220 palabras. Emojis moderados.`;
  },[cards,txns]);

  const send=async text=>{
    const msg=(text||input).trim();
    if(!msg||loading) return;
    setMsgs(p=>[...p,{role:"user",text:msg}]);
    setInput("");setLoading(true);
    try{
      const history=msgs.slice(-8).map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
      const res=await fetch("/api/copilot",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"openai/gpt-oss-120b",max_tokens:1000,system:ctx(),messages:[...history,{role:"user",content:msg}]})
      });
      const data=await res.json();
      if(!res.ok){
        setApiStatus("error");
        setMsgs(p=>[...p,{role:"ai",text:`⚠️ ${data.error||"Error del servidor (${res.status})"}`}]);
      }else{
        setApiStatus("connected");
        const reply=data.reply||"Sin respuesta del servidor.";
        setMsgs(p=>[...p,{role:"ai",text:reply}]);
      }
    }catch{
      setApiStatus("error");
      setMsgs(p=>[...p,{role:"ai",text:"⚠️ Error de conexión. Verifica tu acceso a internet y que GROQ_API_KEY esté configurada."}]);
    }
    setLoading(false);
  };

  useEffect(()=>{
    fetch("/api/copilot",{method:"OPTIONS"})
      .then(r=>setApiStatus(r.ok||r.status===204?"connected":"error"))
      .catch(()=>setApiStatus("error"));
  },[]);

  const statusLabel=apiStatus==="checking"?"Verificando conexión…":apiStatus==="connected"?"● Conectado · Análisis en tiempo real":"● Sin conexión · Revisa configuración";
  const statusColor=apiStatus==="connected"?"var(--tl)":apiStatus==="checking"?"var(--or)":"var(--rd)";

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  return(
    <div className="scr fadeIn copilot-scr">
      <div className="page-pad" style={{display:"flex",gap:12,alignItems:"center",flexShrink:0,paddingBottom:12}}>
        <div style={{width:46,height:46,borderRadius:15,background:"linear-gradient(135deg,var(--tl),var(--tl2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,animation:"gl 2.5s ease-in-out infinite"}}>🤖</div>
        <div>
          <p style={{fontSize:15,fontWeight:800}}>Copiloto IA</p>
          <p style={{fontSize:10,color:statusColor,fontWeight:700}}>{statusLabel}</p>
        </div>
        <span className="pill ptl" style={{marginLeft:"auto",fontSize:9}}>ML activo</span>
      </div>
      <div className="hs px" style={{paddingBottom:12,flexShrink:0,gap:7}}>
        {SUGG.map(s=>(
          <button key={s} onClick={()=>send(s)} style={{padding:"7px 12px",borderRadius:100,background:"var(--tlb)",border:"1px solid var(--tlbr)",color:"var(--tl)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"var(--fn)",transition:"all .15s"}}>
            {s}
          </button>
        ))}
      </div>
      <div className="copilot-msgs">
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="ai"?"flex-start":"flex-end"}}>
            {m.role==="ai"&&<div style={{width:24,height:24,borderRadius:8,background:"linear-gradient(135deg,var(--tl),var(--tl2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,marginBottom:4}}>🤖</div>}
            <div className={m.role==="ai"?"bai":"bus"} style={{whiteSpace:"pre-line"}}>{m.text}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
            <div style={{width:24,height:24,borderRadius:8,background:"linear-gradient(135deg,var(--tl),var(--tl2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,marginBottom:4}}>🤖</div>
            <div className="bai" style={{display:"flex",gap:5,padding:"13px 15px"}}>
              {[0,1,2].map(d=><div key={d} style={{width:7,height:7,borderRadius:"50%",background:"var(--tl)",animation:`pu 1.1s ${d*0.18}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div className="copilot-foot">
        <input className="inp" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Pregunta sobre tus finanzas…" style={{flex:1}}/>
        <button onClick={()=>send()} style={{width:44,height:44,borderRadius:12,background:input?"linear-gradient(135deg,var(--tl),var(--tl2))":"var(--bg3)",border:input?"none":"1px solid var(--b2)",color:input?"#000":"var(--m)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .2s",fontFamily:"var(--fn)"}}>
          <IC.Send style={{width:17,height:17}}/>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ALERTS SCREEN
══════════════════════════════════════════════════════════ */
function AlertsScreen({alerts,setAlerts,setScreen}){
  const dismiss=id=>setAlerts(p=>p.map(a=>a.id===id?{...a,dismissed:true}:a));
  const active=alerts.filter(a=>!a.dismissed);
  const cl={danger:"var(--rd)",warning:"var(--or)",info:"var(--tl)",success:"var(--gn)"};
  const bg={danger:"var(--rdb)",warning:"var(--orb)",info:"var(--tlb)",success:"var(--gnb)"};
  const br={danger:"var(--rdbr)",warning:"var(--orbr)",info:"var(--tlbr)",success:"var(--gnbr)"};
  return(
    <div className="scr fadeIn">
      <div style={{padding:"0 20px 18px",display:"flex",gap:12,alignItems:"center"}}>
        <button className="btn bi" onClick={()=>setScreen("home")}><IC.Back style={{width:16,height:16}}/></button>
        <div><p className="lbl" style={{marginBottom:2}}>CENTRO DE</p><h1 className="h2">Alertas</h1></div>
        {active.length>0&&<span className="pill prd" style={{marginLeft:"auto"}}>{active.length} activas</span>}
      </div>
      {active.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px"}}>
          <p style={{fontSize:52,marginBottom:14}}>🎉</p>
          <p className="h3" style={{marginBottom:6}}>¡Todo en orden!</p>
          <p style={{fontSize:12,color:"var(--m)"}}>Sin alertas activas pendientes</p>
        </div>
      ):active.map(a=>(
        <div key={a.id} style={{margin:"0 20px 10px",padding:15,borderRadius:15,background:bg[a.type],border:`1px solid ${br[a.type]}`}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20}}>{a.icon}</span>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:800,color:cl[a.type],marginBottom:3}}>{a.title}</p>
              <p style={{fontSize:11,color:"var(--m)",lineHeight:1.5}}>{a.body}</p>
            </div>
            <button className="btn bi" style={{width:28,height:28,borderRadius:8,flexShrink:0}} onClick={()=>dismiss(a.id)}><IC.X style={{width:13,height:13}}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function App(){
  const { user, ready: authReady, signIn, signUp, signOut, supabaseEnabled } = useAuth();
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem("cfv6_guest") === "1");
  const { cards, setCards, txns, setTxns, disIds, setDisIds, ready: dataReady, loadDemo } = useDataStore(user);
  const[screen,setScreen]=useState("home");
  const[toastD,setToastD]=useState(null);
  const toast=(msg,type="success")=>setToastD({msg,type});

  const rawAlerts=useMemo(()=>genAlerts(cards,txns),[cards,txns]);
  const alerts=rawAlerts.map(a=>({...a,dismissed:disIds.includes(a.id)}));
  const setAlerts=fn=>{const u=fn(alerts);setDisIds(u.filter(a=>a.dismissed).map(a=>a.id));};
  const TABS=["home","cards","registrar","analytics","copiloto"];
  const activeTab=TABS.includes(screen)?screen:"home";
  const NAV_ITEMS=[
    {id:"home",lb:"Inicio",Ic:IC.Home},
    {id:"cards",lb:"Tarjetas",Ic:IC.Card},
    {id:"registrar",lb:"Registrar",Ic:IC.Plus},
    {id:"analytics",lb:"Analítica",Ic:IC.Chart},
    {id:"copiloto",lb:"Copiloto",Ic:IC.Bot},
  ];
  const activeAlerts=alerts.filter(a=>!a.dismissed).length;

  const handleSkipAuth=()=>{localStorage.setItem("cfv6_guest","1");setGuestMode(true);};
  const handleLoadDemo=async()=>{await loadDemo();toast("✓ Datos de demostración cargados");};

  const showAuth=supabaseEnabled&&!user&&!guestMode;

  if(!authReady||(!showAuth&&!dataReady)) return(
    <>
      <style>{CSS}</style>
      <div className="app" style={{alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid var(--tl)",borderTopColor:"transparent",margin:"0 auto 14px",animation:"sp .75s linear infinite"}}/>
          <p style={{color:"var(--m)",fontSize:12,fontWeight:600}}>Cargando…</p>
        </div>
      </div>
    </>
  );

  if(showAuth) return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="main-col">
          <div className="auth-inner">
            <AuthScreen signIn={signIn} signUp={signUp} supabaseEnabled={supabaseEnabled} onSkip={handleSkipAuth}/>
          </div>
        </div>
      </div>
    </>
  );

  const now=new Date();
  const time=now.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sb-brand-block">
            <img src={`${import.meta.env.BASE_URL}logo-copiloto.png`} alt="Copiloto IA" className="brand-logo" style={{width:36,height:36,borderRadius:10}}/>
            <div>
              <h2>Copiloto IA</h2>
              <p>Wealth Management</p>
            </div>
          </div>
          <nav className="sb-nav">
            {NAV_ITEMS.map(({id,lb,Ic})=>(
              <button key={id} type="button" className={`sb-item${activeTab===id?" on":""}`} onClick={()=>setScreen(id)}>
                {id==="home"&&activeAlerts>0&&screen!=="home"&&<span className="ndot"/>}
                <Ic/>
                <span>{lb}</span>
              </button>
            ))}
          </nav>
          <div className="sb-foot">Tarjetas · Analítica ML · Copiloto IA</div>
        </aside>

        <div className="main-col">
        {/* Status bar */}
        <div className="sb">
          <div className="sb-brand">
            <img src={`${import.meta.env.BASE_URL}logo-copiloto.png`} alt="Copiloto IA" className="brand-logo"/>
            <div>
              <h1>Copiloto IA</h1>
              <p>Wealth Management</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontFamily:"var(--mo)",fontSize:10,fontWeight:700,color:"var(--m)"}}>{time}</span>
            {user&&<button className="btn bg" style={{fontSize:9,padding:"4px 8px"}} onClick={signOut}>Salir</button>}
          </div>
        </div>

        {toastD&&<Toast msg={toastD.msg} type={toastD.type} onDone={()=>setToastD(null)}/>}

        {screen==="home"&&<HomeScreen cards={cards} txns={txns} setScreen={setScreen} alerts={alerts} loadDemo={handleLoadDemo}/>}
        {screen==="cards"&&<CardsScreen cards={cards} setCards={setCards} setTxns={setTxns} txns={txns} toast={toast}/>}
        {screen==="registrar"&&<RegisterScreen cards={cards} txns={txns} setTxns={setTxns} toast={toast}/>}
        {screen==="analytics"&&<AnalyticsScreen cards={cards} txns={txns}/>}
        {screen==="copiloto"&&<CopilotoScreen cards={cards} txns={txns}/>}
        {screen==="alerts"&&<AlertsScreen alerts={alerts} setAlerts={setAlerts} setScreen={setScreen}/>}

        {/* Nav bar — mobile */}
        <div className="nav">
          {NAV_ITEMS.map(({id,lb,Ic})=>(
            <button key={id} className={`nt${activeTab===id?" on":""}`} onClick={()=>setScreen(id)}>
              {id==="home"&&activeAlerts>0&&screen!=="home"&&<span className="ndot"/>}
              <Ic style={{width:21,height:21}}/>
              <span>{lb}</span>
            </button>
          ))}
        </div>
        </div>
      </div>
    </>
  );
}
