'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase ────────────────────────────────────────────────────────────────
const supabase = createClient(
  'https://lhgtadmhbembpovvwglz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3RhZG1oYmVtYnBvdnZ3Z2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTczMTksImV4cCI6MjA4ODI3MzMxOX0.JG23D3-z7JxrVKK6q3tjInHzSzudt-TuwhFLwWb1TVk'
);

// ─── Constants ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00',
];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDay    = (y: number, m: number) => new Date(y, m, 1).getDay();
const today          = new Date();
const fmtDate        = (day: number, month: number) => `${String(day).padStart(2,'0')} de ${MONTHS_PT[month]}`;
const toDateStr      = (day: number, month: number, year: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090b; }
  :root {
    --gold:#f59e0b; --gold2:#eab308;
    --bg:#09090b; --surface:#18181b; --surface2:#27272a;
    --border:#27272a; --border2:#3f3f46;
    --text:#fafafa; --muted:#a1a1aa; --dim:#52525b;
    --red:#f87171; --green:#4ade80;
    --radius:14px; --font:'DM Sans',sans-serif;
  }
  .app { min-height:100dvh; background:var(--bg); font-family:var(--font); color:var(--text); }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* LOGIN */
  .login-wrap { min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem; background:radial-gradient(ellipse at 50% 0%,#2a1a00 0%,#09090b 65%); }
  .login-logo { font-family:'Bebas Neue'; font-size:4rem; color:var(--gold); letter-spacing:0.06em; line-height:1; text-align:center; }
  .login-sub  { color:var(--dim); font-size:0.75rem; letter-spacing:0.25em; text-transform:uppercase; text-align:center; margin-top:0.2rem; margin-bottom:2.5rem; }
  .login-card { width:100%; max-width:380px; background:var(--surface); border:1px solid var(--border2); border-radius:20px; padding:2rem; }
  .login-title { font-size:1.15rem; font-weight:700; margin-bottom:0.25rem; }
  .login-hint  { color:var(--muted); font-size:0.82rem; margin-bottom:1.8rem; }
  .field-label { font-size:0.7rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--dim); margin-bottom:0.4rem; }
  .field-wrap  { margin-bottom:1rem; }
  .field-input { width:100%; padding:0.75rem 1rem; background:var(--surface2); border:1.5px solid var(--border2); border-radius:10px; color:var(--text); font-size:0.95rem; font-family:var(--font); outline:none; transition:border-color 0.15s; }
  .field-input:focus { border-color:var(--gold); }
  .field-input::placeholder { color:var(--dim); }
  .error-msg { color:var(--red); font-size:0.82rem; margin-bottom:0.8rem; background:rgba(248,113,113,0.08); padding:0.5rem 0.75rem; border-radius:8px; border:1px solid rgba(248,113,113,0.2); }
  .btn-gold { width:100%; padding:0.85rem; background:linear-gradient(90deg,var(--gold),var(--gold2)); border:none; border-radius:10px; color:#000; font-weight:700; font-size:0.95rem; font-family:var(--font); cursor:pointer; transition:all 0.2s; box-shadow:0 4px 20px rgba(245,158,11,0.3); display:flex; align-items:center; justify-content:center; gap:0.5rem; }
  .btn-gold:hover   { transform:translateY(-1px); box-shadow:0 6px 28px rgba(245,158,11,0.45); }
  .btn-gold:active  { transform:scale(0.98); }
  .btn-gold:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

  /* DASHBOARD */
  .dash-wrap { display:flex; flex-direction:column; min-height:100dvh; max-width:480px; margin:0 auto; }
  .topbar { position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; padding:1rem 1.2rem; background:rgba(9,9,11,0.9); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }
  .topbar-logo  { font-family:'Bebas Neue'; font-size:1.6rem; color:var(--gold); letter-spacing:0.06em; }
  .topbar-right { display:flex; align-items:center; gap:0.8rem; }
  .avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; color:#000; }
  .logout-btn { padding:0.3rem 0.75rem; border-radius:999px; border:1.5px solid var(--border2); background:transparent; color:var(--muted); font-size:0.75rem; font-family:var(--font); cursor:pointer; transition:all 0.15s; }
  .logout-btn:hover { border-color:var(--red); color:var(--red); }
  .greeting { padding:1.4rem 1.2rem 0.8rem; }
  .greeting-name { font-size:1.4rem; font-weight:700; }
  .greeting-sub  { color:var(--muted); font-size:0.85rem; margin-top:0.15rem; }
  .tabs { display:flex; gap:0.4rem; padding:0 1.2rem 1rem; }
  .tab-btn { flex:1; padding:0.55rem; border-radius:10px; border:1.5px solid var(--border2); background:transparent; color:var(--muted); font-size:0.85rem; font-weight:600; font-family:var(--font); cursor:pointer; transition:all 0.15s; }
  .tab-btn.active { background:var(--gold); border-color:var(--gold); color:#000; }
  .tab-content { flex:1; padding:0 1.2rem 6rem; }

  /* AGENDA */
  .date-scroll { display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.5rem; margin-bottom:1.2rem; scrollbar-width:none; }
  .date-scroll::-webkit-scrollbar { display:none; }
  .date-chip { flex-shrink:0; display:flex; flex-direction:column; align-items:center; padding:0.6rem 0.9rem; border-radius:12px; border:1.5px solid var(--border); background:var(--surface); cursor:pointer; transition:all 0.15s; min-width:52px; }
  .date-chip:hover { border-color:var(--gold); }
  .date-chip.active { background:var(--gold); border-color:var(--gold); }
  .date-chip .dc-day { font-size:0.65rem; font-weight:600; letter-spacing:0.05em; color:var(--muted); text-transform:uppercase; }
  .date-chip .dc-num { font-size:1.1rem; font-weight:700; color:var(--text); margin-top:0.1rem; }
  .date-chip.active .dc-day,.date-chip.active .dc-num { color:#000; }
  .appt-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:1rem 1.1rem; margin-bottom:0.7rem; }
  .appt-header { display:flex; align-items:center; gap:0.8rem; margin-bottom:0.5rem; }
  .appt-time  { font-size:1rem; font-weight:700; color:var(--gold); min-width:48px; }
  .appt-name  { font-weight:600; font-size:0.95rem; flex:1; }
  .appt-total { font-weight:700; color:var(--gold); font-size:0.9rem; }
  .appt-svcs  { display:flex; flex-wrap:wrap; gap:0.35rem; }
  .appt-svc-tag { font-size:0.72rem; padding:0.2rem 0.55rem; border-radius:999px; background:var(--surface2); color:var(--muted); }
  .appt-fone  { font-size:0.78rem; color:var(--dim); margin-top:0.4rem; }
  .status-badge { font-size:0.65rem; font-weight:600; padding:0.15rem 0.5rem; border-radius:999px; text-transform:uppercase; letter-spacing:0.05em; }
  .status-confirmado { background:rgba(74,222,128,0.12); color:var(--green); }
  .status-cancelado  { background:rgba(248,113,113,0.12); color:var(--red); }
  .status-concluido  { background:rgba(161,161,170,0.12); color:var(--muted); }
  .empty-state { text-align:center; padding:3rem 1rem; color:var(--dim); font-size:0.9rem; }
  .empty-icon  { font-size:2.5rem; margin-bottom:0.7rem; }
  .sec-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; }
  .sec-title  { font-size:0.72rem; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); }

  /* NOVO AGENDAMENTO */
  .card-block { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:1.2rem; margin-bottom:1rem; }
  .card-block-title { font-size:0.7rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--dim); margin-bottom:0.9rem; }
  .mini-cal-nav { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.9rem; }
  .mini-cal-nav span { font-weight:600; font-size:0.9rem; }
  .nav-arrows { display:flex; gap:0.3rem; }
  .arr-btn { width:28px; height:28px; border-radius:7px; border:1.5px solid var(--border2); background:transparent; color:var(--muted); cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; transition:all 0.12s; }
  .arr-btn:hover { border-color:var(--gold); color:var(--gold); }
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
  .cal-dh   { text-align:center; font-size:0.62rem; color:var(--dim); font-weight:600; padding:0.15rem 0; letter-spacing:0.04em; }
  .cal-day  { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:0.82rem; cursor:pointer; border:none; background:transparent; color:var(--muted); transition:all 0.12s; }
  .cal-day:hover:not(.cal-past) { background:var(--surface2); color:var(--gold); }
  .cal-day.cal-today    { border:1.5px solid var(--gold); color:var(--gold); }
  .cal-day.cal-selected { background:var(--gold)!important; color:#000!important; font-weight:700; }
  .cal-day.cal-past     { opacity:0.22; cursor:not-allowed; }
  .chip-wrap { display:flex; flex-wrap:wrap; gap:0.45rem; }
  .chip { padding:0.4rem 0.85rem; border-radius:999px; border:1.5px solid var(--border2); background:var(--surface); color:var(--muted); font-size:0.82rem; font-weight:500; font-family:var(--font); cursor:pointer; transition:all 0.12s; }
  .chip:hover  { border-color:var(--gold); color:var(--gold); }
  .chip.active { background:var(--gold); border-color:var(--gold); color:#000; font-weight:700; }
  .svc-card { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0.9rem; border-radius:10px; border:1.5px solid var(--border); background:transparent; cursor:pointer; transition:all 0.12s; margin-bottom:0.5rem; }
  .svc-card:hover  { border-color:rgba(245,158,11,0.3); }
  .svc-card.active { border-color:var(--gold); background:#1c1a0e; }
  .svc-left  { display:flex; align-items:center; gap:0.6rem; }
  .svc-icon  { font-size:1.1rem; }
  .svc-name  { font-weight:600; font-size:0.9rem; }
  .svc-dur   { font-size:0.72rem; color:var(--dim); }
  .svc-price { font-weight:700; font-size:0.9rem; color:var(--muted); }
  .svc-card.active .svc-price { color:var(--gold); }
  .summary-block { background:#111008; border:1px solid #2a2008; border-radius:var(--radius); padding:1rem 1.1rem; margin-bottom:1rem; }
  .sum-row { display:flex; justify-content:space-between; padding:0.28rem 0; }
  .sum-key { color:var(--muted); font-size:0.85rem; }
  .sum-val { color:var(--text); font-size:0.85rem; font-weight:500; }
  .sum-div { height:1px; background:var(--border); margin:0.5rem 0; }
  .sum-total-key { font-weight:700; color:var(--text); font-size:0.9rem; }
  .sum-total-val { font-weight:700; color:var(--gold); font-size:1rem; }
  .success-wrap { text-align:center; padding:2rem 0; }
  .success-check { width:62px; height:62px; border-radius:50%; background:var(--gold); margin:0 auto 1rem; display:flex; align-items:center; justify-content:center; font-size:1.8rem; color:#000; }
  .bottom-pad { height:2rem; }
  .loading-full { min-height:100dvh; display:flex; align-items:center; justify-content:center; background:var(--bg); }

  /* MODAL */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:100; display:flex; align-items:flex-end; justify-content:center; padding:1rem; backdrop-filter:blur(4px); animation:fadeIn 0.15s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal-box { width:100%; max-width:480px; background:var(--surface); border:1px solid var(--border2); border-radius:20px; padding:1.5rem; animation:slideUp 0.2s ease; }
  @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-title { font-weight:700; font-size:1.05rem; margin-bottom:0.2rem; }
  .modal-sub   { color:var(--muted); font-size:0.82rem; margin-bottom:1.2rem; }
  .modal-divider { height:1px; background:var(--border); margin:1rem 0; }
  .modal-btn { width:100%; padding:0.8rem; border-radius:12px; border:none; font-size:0.95rem; font-weight:700; font-family:var(--font); cursor:pointer; transition:all 0.15s; margin-bottom:0.6rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
  .modal-btn-green  { background:rgba(74,222,128,0.12); color:#4ade80; border:1.5px solid rgba(74,222,128,0.25); }
  .modal-btn-green:hover  { background:rgba(74,222,128,0.2); }
  .modal-btn-red    { background:rgba(248,113,113,0.12); color:#f87171; border:1.5px solid rgba(248,113,113,0.25); }
  .modal-btn-red:hover    { background:rgba(248,113,113,0.2); }
  .modal-btn-ghost  { background:transparent; color:var(--muted); border:1.5px solid var(--border2); margin-bottom:0; }
  .modal-btn-ghost:hover  { border-color:var(--border2); color:var(--text); }
  .appt-card-clickable { cursor:pointer; transition:border-color 0.15s; }
  .appt-card-clickable:hover { border-color:var(--border2) !important; filter:brightness(1.05); }
  .appt-card-concluido { opacity:0.5; }

  /* FATURAMENTO */
  .fat-period-tabs { display:flex; gap:0.4rem; margin-bottom:1.2rem; }
  .fat-period-btn { flex:1; padding:0.45rem; border-radius:8px; border:1.5px solid var(--border2); background:transparent; color:var(--muted); font-size:0.8rem; font-weight:600; font-family:var(--font); cursor:pointer; transition:all 0.15s; }
  .fat-period-btn.active { background:var(--gold); border-color:var(--gold); color:#000; }
  .fat-stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; margin-bottom:1rem; }
  .fat-stat { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:1rem; }
  .fat-stat-label { font-size:0.68rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--dim); margin-bottom:0.4rem; }
  .fat-stat-value { font-size:1.4rem; font-weight:700; color:var(--text); line-height:1; }
  .fat-stat-value.gold { color:var(--gold); }
  .fat-day-row { display:flex; justify-content:space-between; align-items:center; padding:0.7rem 0; border-bottom:1px solid var(--border); }
  .fat-day-row:last-child { border-bottom:none; }
  .fat-day-label { font-size:0.85rem; color:var(--muted); }
  .fat-day-val { font-weight:700; font-size:0.9rem; color:var(--text); }
  .fat-day-val.gold { color:var(--gold); }
  .fat-bar-wrap { flex:1; margin:0 0.8rem; height:6px; background:var(--surface2); border-radius:999px; overflow:hidden; }
  .fat-bar { height:100%; background:var(--gold); border-radius:999px; transition:width 0.4s ease; }

  /* FATURAMENTO TELA CHEIA */
  .fat-screen { position:fixed; inset:0; background:var(--bg); z-index:80; display:flex; flex-direction:column; max-width:480px; margin:0 auto; }
  .fat-screen-header { display:flex; align-items:center; gap:0.8rem; padding:1rem 1.2rem; border-bottom:1px solid var(--border); background:rgba(9,9,11,0.9); backdrop-filter:blur(12px); }
  .fat-back-btn { width:34px; height:34px; border-radius:10px; border:1.5px solid var(--border2); background:transparent; color:var(--muted); cursor:pointer; font-size:1.1rem; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; }
  .fat-back-btn:hover { border-color:var(--gold); color:var(--gold); }
  .fat-screen-title { font-family:'Bebas Neue'; font-size:1.4rem; color:var(--gold); letter-spacing:0.06em; }
  .fat-screen-content { flex:1; overflow-y:auto; padding:1.2rem; }
  .topbar-fat-btn { padding:0.3rem 0.7rem; border-radius:999px; border:1.5px solid var(--border2); background:transparent; color:var(--muted); font-size:0.75rem; font-family:var(--font); cursor:pointer; transition:all 0.15s; }
  .topbar-fat-btn:hover { border-color:var(--gold); color:var(--gold); }
`;

function Spinner({ size = 20, dark = false }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${dark ? 'rgba(0,0,0,0.2)' : 'rgba(245,158,11,0.2)'}`,
      borderTopColor: dark ? '#000' : '#f59e0b',
      borderRadius: '50%', animation: 'spin 0.6s linear infinite',
    }} />
  );
}

// ─── Login ───────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true); setError('');
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;
      const { data: barbeiro, error: dbErr } = await supabase
        .from('barbeiros').select('*').eq('id', data.user.id).single();
      if (dbErr) throw dbErr;
      onLogin(barbeiro);
    } catch {
      setError('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-logo">NC BARBER</div>
      <div className="login-sub">Área dos Barbeiros</div>
      <div className="login-card">
        <div className="login-title">Bem-vindo de volta 👋</div>
        <div className="login-hint">Faça login para acessar sua agenda</div>
        <div className="field-wrap">
          <div className="field-label">Email</div>
          <input className="field-input" type="email" placeholder="seu@email.com"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key==='Enter' && handleLogin()} autoCapitalize="none" autoComplete="email" />
        </div>
        <div className="field-wrap">
          <div className="field-label">Senha</div>
          <input className="field-input" type="password" placeholder="••••••••"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key==='Enter' && handleLogin()} autoComplete="current-password" />
        </div>
        {error && <div className="error-msg">⚠ {error}</div>}
        <button className="btn-gold" onClick={handleLogin} disabled={!email || !password || loading}>
          {loading ? <Spinner size={18} dark /> : 'Entrar'}
        </button>
      </div>
      <div style={{marginTop:'2rem',color:'#3f3f46',fontSize:'0.72rem',textAlign:'center',letterSpacing:'0.05em'}}>
        developed by <span style={{color:'#71717a',fontWeight:600}}>Kaio Xavier</span>
      </div>
    </div>
  );
}

// ─── Modal de Agendamento ────────────────────────────────────────────────────
function ApptModal({ appt, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', appt.id);
      if (error) throw error;
      onStatusChange(appt.id, status);
      onClose();
    } catch (err) {
      alert('Erro ao atualizar. Tente novamente.');
      console.error(err);
    } finally { setLoading(false); }
  };

  const svcs = appt.agendamento_servicos ?? [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{appt.cliente_nome}</div>
        <div className="modal-sub">{appt.horario?.slice(0,5)} · R$ {Number(appt.total).toFixed(0)}</div>

        <div style={{display:'flex',flexWrap:'wrap',gap:'0.35rem',marginBottom:'0.8rem'}}>
          {svcs.map((as, i) => (
            <span key={i} className="appt-svc-tag">{as.servicos?.icone} {as.servicos?.nome}</span>
          ))}
        </div>
        {appt.cliente_fone && <div className="appt-fone" style={{marginBottom:'0.5rem'}}>📞 {appt.cliente_fone}</div>}

        <div className="modal-divider"/>

        {appt.status === 'confirmado' && (
          <>
            <button className="modal-btn modal-btn-green" onClick={() => updateStatus('concluido')} disabled={loading}>
              {loading ? <Spinner size={16} /> : '✓ Marcar como concluído'}
            </button>
            <button className="modal-btn modal-btn-red" onClick={() => updateStatus('cancelado')} disabled={loading}>
              {loading ? <Spinner size={16} /> : '✕ Cancelar agendamento'}
            </button>
          </>
        )}
        {appt.status === 'concluido' && (
          <button className="modal-btn modal-btn-red" onClick={() => updateStatus('cancelado')} disabled={loading}>
            {loading ? <Spinner size={16} /> : '✕ Cancelar agendamento'}
          </button>
        )}

        <div className="modal-divider" style={{margin:'0.6rem 0'}}/>
        <button className="modal-btn modal-btn-ghost" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

// ─── Agenda ──────────────────────────────────────────────────────────────────
function AgendaTab({ barber }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i); return d;
  });
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const activeDay = days[activeDayIdx];
  const dateStr   = activeDay.toISOString().split('T')[0];

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('agendamentos')
        .select('id, cliente_nome, cliente_fone, horario, total, status, agendamento_servicos(preco_cobrado, servicos(nome, icone))')
        .eq('barbeiro_id', barber.id)
        .eq('data', dateStr)
        .neq('status', 'cancelado')
        .order('horario');
      setAgendamentos(data ?? []);
    } finally { setLoading(false); }
  }, [barber.id, dateStr]);

  useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

  const handleStatusChange = (id, status) => {
    if (status === 'cancelado') {
      setAgendamentos(prev => prev.filter(a => a.id !== id));
    } else {
      setAgendamentos(prev => prev.map(a => a.id === id ? {...a, status} : a));
    }
  };

  const visibleAppts = agendamentos;

  return (
    <div>
      {selectedAppt && (
        <ApptModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      <div className="date-scroll">
        {days.map((d, i) => (
          <div key={i} className={`date-chip ${activeDayIdx===i?'active':''}`} onClick={() => setActiveDayIdx(i)}>
            <span className="dc-day">{WEEKDAYS[d.getDay()]}</span>
            <span className="dc-num">{d.getDate()}</span>
          </div>
        ))}
      </div>
      <div className="sec-header">
        <span className="sec-title">{activeDayIdx===0 ? 'Hoje' : fmtDate(activeDay.getDate(), activeDay.getMonth())}</span>
        {!loading && <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>{visibleAppts.length} agendamento{visibleAppts.length!==1?'s':''}</span>}
      </div>
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem'}}><Spinner size={28} /></div>
      ) : visibleAppts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📅</div><div>Nenhum agendamento neste dia</div></div>
      ) : visibleAppts.map(a => (
        <div key={a.id} className={`appt-card appt-card-clickable ${a.status==='concluido'?'appt-card-concluido':''}`}
          onClick={() => setSelectedAppt(a)}
          style={{borderColor: a.status==='concluido' ? 'var(--border)' : 'var(--border)'}}>
          <div className="appt-header">
            <div className="appt-time">{a.horario?.slice(0,5)}</div>
            <div className="appt-name">{a.cliente_nome}</div>
            <div className="appt-total">R$ {Number(a.total).toFixed(0)}</div>
          </div>
          <div className="appt-svcs">
            {(a.agendamento_servicos ?? []).map((as, i) => (
              <span key={i} className="appt-svc-tag">{as.servicos?.icone} {as.servicos?.nome}</span>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'0.5rem'}}>
            {a.cliente_fone && <div className="appt-fone">📞 {a.cliente_fone}</div>}
            <span className={`status-badge status-${a.status}`}>{a.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Novo Agendamento ─────────────────────────────────────────────────────────
function NovoAgendamentoTab({ barber }) {
  const [viewYear, setViewYear]       = useState(today.getFullYear());
  const [viewMonth, setViewMonth]     = useState(today.getMonth());
  const [selDay, setSelDay]           = useState(null);
  const [selTime, setSelTime]         = useState(null);
  const [selServices, setSelServices] = useState([]);
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [desconto, setDesconto]         = useState('');
  const [services, setServices]       = useState([]);
  const [loadingSvcs, setLoadingSvcs] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [done, setDone]               = useState(false);
  const [savedAppt, setSavedAppt]     = useState(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDay(viewYear, viewMonth);

  useEffect(() => {
    supabase.from('servicos').select('*').eq('ativo', true).order('id')
      .then(({ data }) => { setServices(data ?? []); setLoadingSvcs(false); });
  }, []);

  const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };
  const isPast    = (d) => new Date(viewYear,viewMonth,d) < new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const isToday   = (d) => d===today.getDate() && viewMonth===today.getMonth() && viewYear===today.getFullYear();

  const toggleSvc     = (s) => setSelServices(p => p.find(x=>x.id===s.id) ? p.filter(x=>x.id!==s.id) : [...p,s]);
  const isSelSvc      = (s) => !!selServices.find(x=>x.id===s.id);
  const subtotal      = selServices.reduce((sum,s)=>sum+Number(s.preco),0);
  const descontoVal   = Math.min(Number(desconto) || 0, subtotal);
  const totalPrice    = subtotal - descontoVal;
  const totalDuration = selServices.reduce((sum,s)=>sum+s.duracao,0);
  const canConfirm    = selDay && selTime && selServices.length>0 && clientName;

  const handleConfirm = async () => {
    if (!canConfirm || saving) return;
    setSaving(true);
    try {
      const { data: appt, error: apptErr } = await supabase
        .from('agendamentos')
        .insert({ barbeiro_id:barber.id, cliente_nome:clientName, cliente_fone:clientPhone||null,
          data:toDateStr(selDay,viewMonth,viewYear), horario:selTime+':00',
          total:totalPrice, duracao_total:totalDuration, desconto:descontoVal })
        .select().single();
      if (apptErr) throw apptErr;

      const { error: svcsErr } = await supabase.from('agendamento_servicos').insert(
        selServices.map(s => ({ agendamento_id:appt.id, servico_id:s.id, preco_cobrado:s.preco }))
      );
      if (svcsErr) throw svcsErr;

      setSavedAppt({ ...appt, servicos: selServices });
      setDone(true);
    } catch (err) {
      alert('Erro ao salvar. Tente novamente.');
      console.error(err);
    } finally { setSaving(false); }
  };

  const handleNew = () => {
    setSelDay(null); setSelTime(null); setSelServices([]);
    setClientName(''); setClientPhone(''); setDesconto(''); setDone(false); setSavedAppt(null);
  };

  if (done && savedAppt) return (
    <div className="success-wrap">
      <div className="success-check">✓</div>
      <div style={{fontWeight:700,fontSize:'1.2rem',marginBottom:'0.3rem'}}>Agendado!</div>
      <div style={{color:'var(--muted)',fontSize:'0.88rem',marginBottom:'1.5rem'}}>
        {clientName} · {selTime} · {fmtDate(selDay, viewMonth)}
      </div>
      <div className="summary-block" style={{textAlign:'left',maxWidth:320,margin:'0 auto 1.5rem'}}>
        {savedAppt.servicos.map(s=>(
          <div key={s.id} className="sum-row">
            <span className="sum-key">{s.icone} {s.nome}</span>
            <span className="sum-val">R$ {Number(s.preco).toFixed(0)}</span>
          </div>
        ))}
        <div className="sum-row"><span className="sum-key">Barbeiro</span><span className="sum-val">{barber.nome}</span></div>
        <div className="sum-row"><span className="sum-key">Horário</span><span className="sum-val">{selTime}</span></div>
        <div className="sum-row"><span className="sum-key">Duração</span><span className="sum-val">{totalDuration} min</span></div>
        <div className="sum-div"/>
        {descontoVal>0 && <div className="sum-row"><span className="sum-key" style={{color:'#4ade80'}}>Desconto</span><span className="sum-val" style={{color:'#4ade80'}}>- R$ {descontoVal},00</span></div>}
        <div className="sum-div"/>
        <div className="sum-row"><span className="sum-total-key">Total</span><span className="sum-total-val">R$ {totalPrice},00</span></div>
      </div>
      <button className="btn-gold" style={{maxWidth:280,margin:'0 auto',display:'block'}} onClick={handleNew}>
        + Novo agendamento
      </button>
    </div>
  );

  return (
    <div>
      {/* Calendário */}
      <div className="card-block">
        <div className="card-block-title">Data</div>
        <div className="mini-cal-nav">
          <span>{MONTHS_PT[viewMonth]} {viewYear}</span>
          <div className="nav-arrows">
            <button className="arr-btn" onClick={prevMonth}>‹</button>
            <button className="arr-btn" onClick={nextMonth}>›</button>
          </div>
        </div>
        <div className="cal-grid">
          {['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="cal-dh">{d}</div>)}
          {Array.from({length:firstDay}).map((_,i)=><div key={'e'+i}/>)}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>(
            <button key={day}
              className={['cal-day',isPast(day)?'cal-past':'',isToday(day)&&selDay!==day?'cal-today':'',selDay===day?'cal-selected':''].join(' ')}
              onClick={()=>!isPast(day)&&setSelDay(day)}>{day}</button>
          ))}
        </div>
      </div>

      {/* Horários */}
      <div className="card-block">
        <div className="card-block-title">Horário</div>
        <div className="chip-wrap">
          {TIME_SLOTS.map(t=>(
            <button key={t} className={`chip ${selTime===t?'active':''}`} onClick={()=>setSelTime(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Serviços */}
      <div className="card-block">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.9rem'}}>
          <div className="card-block-title" style={{margin:0}}>Serviços</div>
          {selServices.length>0 && (
            <span style={{fontSize:'0.75rem',color:'var(--gold)',fontWeight:600}}>
              {selServices.length} selecionado{selServices.length>1?'s':''}
            </span>
          )}
        </div>
        {loadingSvcs ? (
          <div style={{display:'flex',justifyContent:'center',padding:'1rem'}}><Spinner /></div>
        ) : services.map(s=>{
          const active = isSelSvc(s);
          return (
            <div key={s.id} className={`svc-card ${active?'active':''}`} onClick={()=>toggleSvc(s)}>
              <div className="svc-left">
                <div style={{width:20,height:20,borderRadius:6,border:`1.5px solid ${active?'var(--gold)':'var(--border2)'}`,background:active?'var(--gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.12s'}}>
                  {active && <span style={{color:'#000',fontSize:'0.7rem',fontWeight:900}}>✓</span>}
                </div>
                <span className="svc-icon">{s.icone}</span>
                <div>
                  <div className="svc-name">{s.nome}</div>
                  <div className="svc-dur">{s.duracao} min</div>
                </div>
              </div>
              <div className="svc-price">R$ {Number(s.preco).toFixed(0)}</div>
            </div>
          );
        })}
      </div>

      {/* Cliente */}
      <div className="card-block">
        <div className="card-block-title">Cliente</div>
        <div className="field-wrap">
          <div className="field-label">Nome</div>
          <input className="field-input" placeholder="Nome do cliente" value={clientName} onChange={e=>setClientName(e.target.value)} />
        </div>
        <div className="field-wrap">
          <div className="field-label">Telefone</div>
          <input className="field-input" placeholder="(00) 00000-0000" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} />
        </div>
        <div className="field-wrap" style={{marginBottom:0}}>
          <div className="field-label">Desconto (R$) <span style={{color:'var(--dim)',fontWeight:400,textTransform:'none',letterSpacing:0}}>— opcional</span></div>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:'0.9rem',top:'50%',transform:'translateY(-50%)',color:'var(--dim)',fontSize:'0.9rem',pointerEvents:'none'}}>R$</span>
            <input className="field-input" style={{paddingLeft:'2.2rem'}} placeholder="0" type="number" min="0" value={desconto} onChange={e=>setDesconto(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Resumo */}
      {selServices.length>0 && (
        <div className="summary-block">
          {selServices.map(s=>(
            <div key={s.id} className="sum-row">
              <span className="sum-key">{s.icone} {s.nome}</span>
              <span className="sum-val">R$ {Number(s.preco).toFixed(0)}</span>
            </div>
          ))}
          <div className="sum-row"><span className="sum-key">Data</span><span className="sum-val">{selDay?fmtDate(selDay,viewMonth):'—'}</span></div>
          <div className="sum-row"><span className="sum-key">Horário</span><span className="sum-val">{selTime??'—'}</span></div>
          <div className="sum-row"><span className="sum-key">Duração</span><span className="sum-val">{totalDuration} min</span></div>
          {descontoVal>0 && (
            <>
              <div className="sum-row"><span className="sum-key">Subtotal</span><span className="sum-val">R$ {subtotal},00</span></div>
              <div className="sum-row"><span className="sum-key" style={{color:'#4ade80'}}>Desconto</span><span className="sum-val" style={{color:'#4ade80'}}>- R$ {descontoVal},00</span></div>
            </>
          )}
          <div className="sum-div"/>
          <div className="sum-row"><span className="sum-total-key">Total</span><span className="sum-total-val">R$ {totalPrice},00</span></div>
        </div>
      )}

      <button className="btn-gold" onClick={handleConfirm} disabled={!canConfirm||saving}>
        {saving ? <><Spinner size={18} dark/> Salvando...</> : 'Confirmar Agendamento'}
      </button>
      <div className="bottom-pad"/>
    </div>
  );
}


// ─── Faturamento Tab ──────────────────────────────────────────────────────────
function FaturamentoTab({ barber }) {
  const [period, setPeriod]   = useState('dia');
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const getRange = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2,'0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (period === 'dia') {
      const s = fmt(now); return { start: s, end: s };
    }
    if (period === 'semana') {
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - day + (day===0?-6:1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { start: fmt(mon), end: fmt(sun) };
    }
    // mês
    const start = `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;
    const end   = fmt(new Date(now.getFullYear(), now.getMonth()+1, 0));
    return { start, end };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getRange();
      const { data: rows } = await supabase
        .from('agendamentos')
        .select('data, total, status')
        .eq('barbeiro_id', barber.id)
        .eq('status', 'concluido')
        .gte('data', start)
        .lte('data', end)
        .order('data');
      setData(rows ?? []);
    } finally { setLoading(false); }
  }, [barber.id, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalFaturado  = data.reduce((sum, r) => sum + Number(r.total), 0);
  const totalAtend     = data.length;

  // Agrupa por dia
  const byDay = data.reduce((acc, r) => {
    acc[r.data] = (acc[r.data] || 0) + Number(r.total);
    return acc;
  }, {});
  const dias = Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b));
  const maxVal = Math.max(...dias.map(([,v]) => v), 1);

  const fmtDia = (dateStr) => {
    const [y,m,d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m)-1, Number(d));
    if (period === 'dia') return 'Hoje';
    if (period === 'semana') return dt.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric'});
    return dt.toLocaleDateString('pt-BR',{day:'numeric',month:'short'});
  };

  const periodLabel = { dia: 'hoje', semana: 'esta semana', mes: 'este mês' };

  return (
    <div>
      <div className="fat-period-tabs">
        {[['dia','Hoje'],['semana','Semana'],['mes','Mês']].map(([k,l]) => (
          <button key={k} className={`fat-period-btn ${period===k?'active':''}`} onClick={()=>setPeriod(k)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem'}}><Spinner size={28}/></div>
      ) : (
        <>
          <div className="fat-stat-grid">
            <div className="fat-stat">
              <div className="fat-stat-label">Faturado</div>
              <div className="fat-stat-value gold">R$ {totalFaturado.toFixed(0)}</div>
            </div>
            <div className="fat-stat">
              <div className="fat-stat-label">Atendimentos</div>
              <div className="fat-stat-value">{totalAtend}</div>
            </div>
          </div>

          <div className="card-block">
            <div className="card-block-title">Faturamento por dia</div>
            {dias.length === 0 ? (
              <div style={{textAlign:'center',padding:'1.5rem 0',color:'var(--dim)',fontSize:'0.88rem'}}>
                Nenhum atendimento concluído {periodLabel[period]}
              </div>
            ) : dias.map(([dateStr, val]) => (
              <div key={dateStr} className="fat-day-row">
                <div className="fat-day-label">{fmtDia(dateStr)}</div>
                <div className="fat-bar-wrap">
                  <div className="fat-bar" style={{width:`${(val/maxVal)*100}%`}}/>
                </div>
                <div className="fat-day-val gold">R$ {val.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="bottom-pad"/>
    </div>
  );
}


// ─── Faturamento Tela Cheia ───────────────────────────────────────────────────
function FaturamentoScreen({ barber, onClose }) {
  const [period, setPeriod]   = useState('dia');
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const getRange = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2,'0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (period === 'dia') { const s = fmt(now); return { start: s, end: s }; }
    if (period === 'semana') {
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - day + (day===0?-6:1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { start: fmt(mon), end: fmt(sun) };
    }
    const start = `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`;
    const end   = fmt(new Date(now.getFullYear(), now.getMonth()+1, 0));
    return { start, end };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getRange();
      const { data: rows } = await supabase
        .from('agendamentos')
        .select('data, total, status')
        .eq('barbeiro_id', barber.id)
        .eq('status', 'concluido')
        .gte('data', start)
        .lte('data', end)
        .order('data');
      setData(rows ?? []);
    } finally { setLoading(false); }
  }, [barber.id, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalFaturado = data.reduce((sum, r) => sum + Number(r.total), 0);
  const totalAtend    = data.length;
  const byDay = data.reduce((acc, r) => { acc[r.data] = (acc[r.data]||0)+Number(r.total); return acc; }, {});
  const dias  = Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b));
  const maxVal = Math.max(...dias.map(([,v]) => v), 1);

  const fmtDia = (dateStr) => {
    const [y,m,d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m)-1, Number(d));
    if (period === 'dia') return 'Hoje';
    if (period === 'semana') return dt.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric'});
    return dt.toLocaleDateString('pt-BR',{day:'numeric',month:'short'});
  };

  const periodLabel = { dia:'hoje', semana:'esta semana', mes:'este mês' };

  return (
    <div className="fat-screen">
      <div className="fat-screen-header">
        <button className="fat-back-btn" onClick={onClose}>‹</button>
        <div className="fat-screen-title">Caixa</div>
        <div style={{flex:1}}/>
        <span style={{color:'var(--dim)',fontSize:'0.75rem'}}>
          {today.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}
        </span>
      </div>

      <div className="fat-screen-content">
        <div className="fat-period-tabs">
          {[['dia','Hoje'],['semana','Semana'],['mes','Mês']].map(([k,l]) => (
            <button key={k} className={`fat-period-btn ${period===k?'active':''}`} onClick={()=>setPeriod(k)}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><Spinner size={32}/></div>
        ) : (
          <>
            {/* Stats grandes */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'1.5rem',marginBottom:'1rem',textAlign:'center'}}>
              <div style={{fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--dim)',marginBottom:'0.5rem'}}>
                Total faturado {periodLabel[period]}
              </div>
              <div style={{fontSize:'2.8rem',fontWeight:700,color:'var(--gold)',lineHeight:1}}>
                R$ {totalFaturado.toFixed(0)}
              </div>
              <div style={{color:'var(--muted)',fontSize:'0.85rem',marginTop:'0.5rem'}}>
                {totalAtend} atendimento{totalAtend!==1?'s':''} concluído{totalAtend!==1?'s':''}
              </div>
            </div>

            <div className="fat-stat-grid" style={{marginBottom:'1rem'}}>
              <div className="fat-stat">
                <div className="fat-stat-label">Ticket médio</div>
                <div className="fat-stat-value">{totalAtend>0 ? `R$ ${(totalFaturado/totalAtend).toFixed(0)}` : '—'}</div>
              </div>
              <div className="fat-stat">
                <div className="fat-stat-label">Atendimentos</div>
                <div className="fat-stat-value">{totalAtend}</div>
              </div>
            </div>

            <div className="card-block">
              <div className="card-block-title">Faturamento por dia</div>
              {dias.length === 0 ? (
                <div style={{textAlign:'center',padding:'1.5rem 0',color:'var(--dim)',fontSize:'0.88rem'}}>
                  Nenhum atendimento concluído {periodLabel[period]}
                </div>
              ) : dias.map(([dateStr, val]) => (
                <div key={dateStr} className="fat-day-row">
                  <div className="fat-day-label" style={{minWidth:70}}>{fmtDia(dateStr)}</div>
                  <div className="fat-bar-wrap">
                    <div className="fat-bar" style={{width:`${(val/maxVal)*100}%`}}/>
                  </div>
                  <div className="fat-day-val gold" style={{minWidth:60,textAlign:'right'}}>R$ {val.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="bottom-pad"/>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ barber, onLogout }) {
  const [tab, setTab]       = useState('agenda');
  const [showFat, setShowFat] = useState(false);

  const handleLogout = async () => { await supabase.auth.signOut(); onLogout(); };

  return (
    <div className="dash-wrap">
      {showFat && <FaturamentoScreen barber={barber} onClose={() => setShowFat(false)} />}
      <div className="topbar">
        <div className="topbar-logo">NC BARBER</div>
        <div className="topbar-right">
          <button className="topbar-fat-btn" onClick={() => setShowFat(true)}>💰 Caixa</button>
          <div className="avatar" style={{background: barber.cor ?? '#f59e0b'}}>{barber.avatar}</div>
          <button className="logout-btn" onClick={handleLogout}>Sair</button>
        </div>
      </div>
      <div className="greeting">
        <div className="greeting-name">Olá, {barber.nome} ✂️</div>
        <div className="greeting-sub">{today.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>
      <div className="tabs">
        <button className={`tab-btn ${tab==='agenda'?'active':''}`} onClick={()=>setTab('agenda')}>📅 Agenda</button>
        <button className={`tab-btn ${tab==='novo'?'active':''}`}   onClick={()=>setTab('novo')}>+ Novo</button>
      </div>
      <div className="tab-content">
        {tab==='agenda' ? <AgendaTab barber={barber}/> : <NovoAgendamentoTab barber={barber}/>}
      </div>
    </div>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
export default function NCBarberApp() {
  const [barber, setBarber]     = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase.from('barbeiros').select('*').eq('id', session.user.id).single();
        if (data) setBarber(data);
      }
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setBarber(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="app">
      <style>{CSS}</style>
      {checking ? (
        <div className="loading-full"><Spinner size={36} /></div>
      ) : !barber ? (
        <LoginScreen onLogin={setBarber} />
      ) : (
        <Dashboard barber={barber} onLogout={() => setBarber(null)} />
      )}
    </div>
  );
}