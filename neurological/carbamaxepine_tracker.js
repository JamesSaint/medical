  /**
   * Entries table with AM/PM vitals and robust Repo/Local/Merged handling.
   * - Local: edit/delete works as usual.
   * - Repo: read-only (browser can't write to GitHub) – we alert on edit/delete.
   * - Merged: edit/delete only affects your local copy; repo-only rows are read-only.
   * - Local wins on ID collisions in merged view (so edited local version can override repo).
   */

  const KEY = 'carbamazepine_entries_v1';

  // Repo URLs (tries in order)
  const ORIGIN = window.location.origin;
  const REPO_URLS = [
    '/medical/neurological/carbamazepine-tracker.json',
    `${ORIGIN}/medical/neurological/carbamazepine-tracker.json`,
    'https://jamessaint.github.io/medical/neurological/carbamazepine-tracker.json',
    'https://raw.githubusercontent.com/jamessaint/jamessaint.github.io/main/medical/neurological/carbamazepine-tracker.json',
    'https://raw.githubusercontent.com/jamessaint/jamessaint.github.io/master/medical/neurological/carbamazepine-tracker.json'
  ];

  // Per-device ID prefix so new entries are globally unique
  const DEVICE_ID = (() => {
    const k = 'carbamazepine_device_id';
    let v = localStorage.getItem(k);
    if (!v) {
      v = (crypto?.randomUUID?.() || ('dev-' + Date.now() + '-' + Math.random().toString(36).slice(2)));
      localStorage.setItem(k, v);
    }
    return v;
  })();

  // Utils
  const pad = n => String(n).padStart(2, '0');
  const nowTime = () => { const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const toNum = v => (v === '' || v === null || v === undefined) ? null : Number(v);
  const escapeHTML = s => String(s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  const badge = txt => `<span class="badge-soft">${escapeHTML(txt)}</span>`;
  function uid() {
    const core = crypto?.randomUUID ? crypto.randomUUID()
      : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10));
    return `${DEVICE_ID}-${core}`;
  }

  // Local storage
  function loadEntries() { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
  function saveEntries(entries) { localStorage.setItem(KEY, JSON.stringify(entries)); }

  // Normalization (adds vitals)
  function normalizeEntries(arr) {
    return arr.map(e => ({
      id: e.id ?? `${e.date ?? ''}_${e.time ?? ''}_${e.dose ?? ''}`,
      date: e.date ?? '',
      time: e.time ?? '',
      dose: Number(e.dose ?? 0),
      pain: Number(e.pain ?? 0),
      sedation: Number(e.sedation ?? 0),
      dizziness: Number(e.dizziness ?? 0),
      nausea: Number(e.nausea ?? 0),
      brainfog: Number(e.brainfog ?? 0),
      sleep: Number(e.sleep ?? 0),
      appetite: e.appetite ?? 'Normal',
      effects: Array.isArray(e.effects) ? e.effects
        : String(e.effects ?? '').split(';').map(s => s.trim()).filter(Boolean),
      notes: e.notes ?? '',
      am_sys: toNum(e.am_sys),
      am_dia: toNum(e.am_dia),
      am_hr:  toNum(e.am_hr),
      pm_sys: toNum(e.pm_sys),
      pm_dia: toNum(e.pm_dia),
      pm_hr:  toNum(e.pm_hr),
    }));
  }

  // Rendering
  const fmtVitals = (sys, dia, hr) => {
    if (sys == null && dia == null && hr == null) return '—';
    const bp = (sys != null || dia != null) ? `${sys ?? '?'}\/${dia ?? '?'}` : '';
    const pulse = (hr != null) ? ` • ${hr}` : '';
    return (bp || pulse) ? `${bp}${pulse}` : '—';
  };

  function entryRow(e) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Date">${e.date}</td>
      <td data-label="Time">${e.time}</td>
      <td class="num" data-label="Dose">${e.dose}</td>
      <td class="num" data-label="Pain">${e.pain}</td>
      <td class="num" data-label="Sedation">${e.sedation}</td>
      <td class="num" data-label="Dizziness">${e.dizziness}</td>
      <td class="num" data-label="Nausea">${e.nausea}</td>
      <td class="num" data-label="Brain Fog">${e.brainfog}</td>
      <td class="num" data-label="Sleep">${e.sleep}</td>
      <td data-label="Appetite">${badge(e.appetite)}</td>
      <td data-label="Effects">${(e.effects||[]).map(badge).join(' ')}</td>
      <td data-label="AM BP / Pulse">${fmtVitals(e.am_sys, e.am_dia, e.am_hr)}</td>
      <td data-label="PM BP / Pulse">${fmtVitals(e.pm_sys, e.pm_dia, e.pm_hr)}</td>
      <td class="notes" data-label="Notes">${e.notes ? escapeHTML(e.notes) : ''}</td>
      <td class="actions d-flex gap-1" data-label="Actions">
        <button class="btn btn-outline-secondary btn-sm" data-action="edit" data-id="${e.id}">Edit</button>
        <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${e.id}">Delete</button>
      </td>`;
    return tr;
  }

  function renderEmptyRow(msg) {
    const tbody = document.querySelector('#entriesTable tbody');
    const cols = document.querySelectorAll('#entriesTable thead th').length || 15;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="${cols}" class="text-center py-3 small text-muted">${msg}</td>`;
    tbody.appendChild(tr);
  }

  function renderTableFrom(entries) {
    const tbody = document.querySelector('#entriesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!entries || entries.length === 0) { renderEmptyRow('No data.'); return; }
    entries.slice().sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time))
      .forEach(e => tbody.appendChild(entryRow(e)));
  }
  const renderTable = () => renderTableFrom(loadEntries());

  // Merge: **repo first, then local** so local wins on key collision
  function mergeDedup(a, b) {
    const map = new Map();
    const put = e => {
      const key = e.id || `${e.date}_${e.time}_${e.dose}`;
      const prev = map.get(key);
      if (!prev) map.set(key, e);
      else {
        const A = (prev.date||'') + (prev.time||'');
        const B = (e.date||'') + (e.time||'');
        if (B >= A) map.set(key, e); // >= so later put wins on tie
      }
    };
    // repo then local -> local overrides
    normalizeEntries(a).forEach(put); // a = repo
    normalizeEntries(b).forEach(put); // b = local
    return Array.from(map.values());
  }

  function toCSV(entries) {
    const cols = [
      "date","time","dose","pain","sedation","dizziness","nausea","brainfog","sleep",
      "appetite","effects","am_sys","am_dia","am_hr","pm_sys","pm_dia","pm_hr","notes","id"
    ];
    const header = cols.join(',');
    const lines = entries.map(e => cols.map(c => {
      let v = e[c]; if (Array.isArray(v)) v = v.join('; ');
      if (v == null) v = ''; v = String(v).replace(/"/g,'""'); return `"${v}"`;
    }).join(','));
    return [header, ...lines].join('\n');
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // Repo loader
  async function fetchJSON(url) {
    const bust = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${bust}ts=${Date.now()}`, { cache: 'no-store', mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let data;
    try { data = await res.json(); }
    catch { data = JSON.parse(await res.text()); }
    let arr = null;
    if (Array.isArray(data)) arr = data;
    else if (data && typeof data === 'object') {
      const keys = ['entries','data','items','rows','records','list'];
      for (const k of keys) if (Array.isArray(data[k])) { arr = data[k]; break; }
      if (!arr) {
        const bucket = [];
        Object.values(data).forEach(v => { if (Array.isArray(v)) v.forEach(x => { if (x && typeof x === 'object') bucket.push(x); }); });
        if (bucket.length) arr = bucket;
      }
    }
    return arr ? normalizeEntries(arr) : [];
  }
  async function loadEntriesRepo() {
    for (const u of REPO_URLS) { try { const rows = await fetchJSON(u); if (rows) return rows; } catch {} }
    return [];
  }
  async function loadEntriesMerged() {
    const [repo, local] = await Promise.all([loadEntriesRepo(), Promise.resolve(loadEntries())]);
    return mergeDedup(repo, local);
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    const timeEl = document.getElementById('time');
    if (timeEl) timeEl.value = nowTime();

    const selector = document.getElementById('data-source');
    const source = () => (selector?.value || 'local');

    async function renderBySource() {
      const s = source();
      if (s === 'local') renderTable();
      else if (s === 'repo') renderTableFrom(await loadEntriesRepo());
      else renderTableFrom(await loadEntriesMerged());
    }

    // Prefer Repo if Local is empty and Repo has rows
    (async () => {
      if (loadEntries().length === 0 && selector) {
        const repo = await loadEntriesRepo();
        if (repo.length) { selector.value = 'repo'; renderTableFrom(repo); return; }
      }
      renderBySource();
    })();

    selector?.addEventListener('change', renderBySource);

    // Form submit -> LOCAL only
    const form = document.getElementById('entryForm');
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const appetite = document.querySelector('input[name="appetite"]:checked')?.value || 'Normal';
      const effects = [];
      ['fx_itch','fx_vision','fx_headache','fx_gi'].forEach(id => { const el = document.getElementById(id); if (el?.checked) effects.push(el.value); });

      const entry = {
        id: uid(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        dose: Number(document.getElementById('dose').value),
        pain: Number(document.getElementById('pain').value),
        sedation: Number(document.getElementById('sedation').value),
        dizziness: Number(document.getElementById('dizziness').value),
        nausea: Number(document.getElementById('nausea').value),
        brainfog: Number(document.getElementById('brainfog').value),
        sleep: Number(document.getElementById('sleep').value),
        appetite, effects,
        notes: document.getElementById('notes').value.trim(),
        am_sys: toNum(document.getElementById('am_sys')?.value),
        am_dia: toNum(document.getElementById('am_dia')?.value),
        am_hr:  toNum(document.getElementById('am_hr')?.value),
        pm_sys: toNum(document.getElementById('pm_sys')?.value),
        pm_dia: toNum(document.getElementById('pm_dia')?.value),
        pm_hr:  toNum(document.getElementById('pm_hr')?.value),
      };

      const entries = loadEntries(); entries.push(entry); saveEntries(entries);
      if (source() !== 'repo') renderBySource();

      form.reset(); if (timeEl) timeEl.value = nowTime();
    });

    // Table actions — handle Local vs Repo vs Merged
    document.querySelector('#entriesTable')?.addEventListener('click', async ev => {
      const btn = ev.target.closest('button[data-action]'); if (!btn) return;
      const id = btn.getAttribute('data-id'); const action = btn.getAttribute('data-action');
      const s = source();

      // Helper: find row by id in current source
      async function getRowById(id) {
        if (s === 'local') {
          const local = loadEntries(); return local.find(e => e.id === id) || null;
        } else if (s === 'repo') {
          const repo = await loadEntriesRepo(); return repo.find(e => e.id === id) || null;
        } else {
          const merged = await loadEntriesMerged(); return merged.find(e => e.id === id) || null;
        }
      }

      if (action === 'delete') {
        if (s === 'local') {
          const local = loadEntries();
          const idx = local.findIndex(e => e.id === id);
          if (idx !== -1) { local.splice(idx, 1); saveEntries(local); }
          renderBySource();
        } else if (s === 'merged') {
          // Delete only affects local rows
          const local = loadEntries();
          const idx = local.findIndex(e => e.id === id);
          if (idx !== -1) {
            local.splice(idx, 1); saveEntries(local); renderBySource();
          } else {
            alert('This row comes from the Repo and is read-only here.');
          }
        } else {
          alert('Repo view is read-only. Switch to Local or Merged to manage your local copy.');
        }
      }

      if (action === 'edit') {
        if (s === 'local') {
          const local = loadEntries();
          const idx = local.findIndex(e => e.id === id);
          if (idx === -1) return;
          const eRow = local[idx];

          // Fill minimal fields for quick edit
          const set = (i,v)=>{ const el=document.getElementById(i); if(el) el.value=(v ?? ''); };
          set('date', eRow.date); set('time', eRow.time); set('dose', eRow.dose); set('notes', eRow.notes);
          set('am_sys', eRow.am_sys); set('am_dia', eRow.am_dia); set('am_hr', eRow.am_hr);
          set('pm_sys', eRow.pm_sys); set('pm_dia', eRow.pm_dia); set('pm_hr', eRow.pm_hr);

          // Remove old local row — saving will write updated one
          local.splice(idx, 1); saveEntries(local); renderBySource();
        } else if (s === 'merged') {
          // Prefer editing local copy if it exists; otherwise we can load repo values into the form
          const local = loadEntries();
          let idx = local.findIndex(e => e.id === id);
          let eRow = idx !== -1 ? local[idx] : await getRowById(id);
          if (!eRow) return;

          // Fill form
          const set = (i,v)=>{ const el=document.getElementById(i); if(el) el.value=(v ?? ''); };
          set('date', eRow.date); set('time', eRow.time); set('dose', eRow.dose); set('notes', eRow.notes);
          set('am_sys', eRow.am_sys); set('am_dia', eRow.am_dia); set('am_hr', eRow.am_hr);
          set('pm_sys', eRow.pm_sys); set('pm_dia', eRow.pm_dia); set('pm_hr', eRow.pm_hr);

          // If local row exists, remove it so the saved edit replaces it cleanly
          if (idx !== -1) { local.splice(idx, 1); saveEntries(local); }
          // If it only exists in repo, we simply load values; saving will create a local edited copy.
          renderBySource();
        } else {
          // Repo view: read-only; allow user to edit by loading values but warn that saving creates a local copy
          const eRow = await getRowById(id);
          if (!eRow) return;
          const set = (i,v)=>{ const el=document.getElementById(i); if(el) el.value=(v ?? ''); };
          set('date', eRow.date); set('time', eRow.time); set('dose', eRow.dose); set('notes', eRow.notes);
          set('am_sys', eRow.am_sys); set('am_dia', eRow.am_dia); set('am_hr', eRow.am_hr);
          set('pm_sys', eRow.pm_sys); set('pm_dia', eRow.pm_dia); set('pm_hr', eRow.pm_hr);
          alert('Repo view is read-only. Any changes you save will be stored in your Local data.');
        }
      }
    });

    // Export / Import / Clear
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const data = JSON.stringify(loadEntries(), null, 2);
      download('carbamazepine-tracker.json', data, 'application/json');
    });
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      const csv = toCSV(loadEntries());
      download('carbamazepine-tracker.csv', csv, 'text/csv');
    });

    const importInput = document.getElementById('import-file');
    document.getElementById('btn-import-json')?.addEventListener('click', () => importInput.click());
    importInput?.addEventListener('change', e => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arr = JSON.parse(reader.result);
          if (Array.isArray(arr)) { saveEntries(arr); renderBySource(); }
          else alert('Invalid JSON format');
        } catch { alert('Import failed'); }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-clear-all')?.addEventListener('click', () => {
      if (confirm('Clear all entries stored in this browser?')) { saveEntries([]); renderBySource(); }
    });

    // Safe export & archive (merge with Repo first)
    function stamp() { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; }
    document.getElementById('btn-safe-export')?.addEventListener('click', async () => {
      const merged = mergeDedup(await loadEntriesRepo(), loadEntries());
      download('carbamazepine-tracker.json', JSON.stringify(merged, null, 2), 'application/json');
    });
    document.getElementById('btn-archive-snapshot')?.addEventListener('click', async () => {
      const merged = mergeDedup(await loadEntriesRepo(), loadEntries());
      download(`carbamazepine-tracker-${stamp()}.json`, JSON.stringify(merged, null, 2), 'application/json');
    });
  });