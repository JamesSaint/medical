/*jslint browser: true, devel: true, for: true */
/*global window, document, Blob, URL, FileReader, alert, confirm, prompt */

(function () {
    // ---------------- Config ----------------
    var STORAGE_KEY = 'carbamazepine_entries_v2';

    // ---------------- Utils ----------------
    function lsGet(k) {
        try { return window.localStorage.getItem(k); } catch (e) { console.warn('ls get', e); return null; }
    }
    function lsSet(k, v) {
        try { window.localStorage.setItem(k, v); return true; } catch (e) { console.warn('ls set', e); return false; }
    }
    function uid() {
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            var b = new Uint32Array(4); window.crypto.getRandomValues(b);
            return 'id-' + Array.prototype.map.call(b, function (x) { return ('00000000' + x.toString(16)).slice(-8); }).join('');
        }
        return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
    function escapeHTML(s) {
        if (s === null || s === undefined) { return ''; }
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function toCSV(rows) {
        if (!rows || !rows.length) { return ''; }
        var headers = Object.keys(rows[0]);
        function esc(v) {
            var s = (v === null || v === undefined) ? '' : String(v);
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }
        var head = headers.map(esc).join(',');
        var body = rows.map(function (r) { return headers.map(function (h) { return esc(r[h]); }).join(','); }).join('\n');
        return head + '\n' + body;
    }
    function download(filename, mime, content) {
        var blob = new Blob([content], { type: mime });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 250);
    }
    function todayISO() {
        var d = new Date(), m = String(d.getMonth() + 1), day = String(d.getDate());
        if (m.length === 1) { m = '0' + m; } if (day.length === 1) { day = '0' + day; }
        return d.getFullYear() + '-' + m + '-' + day;
    }

    // ---------------- Store ----------------
    var Store = {
        _cache: null,
        load: function () {
            if (this._cache) { return this._cache.slice(); }
            var raw = lsGet(STORAGE_KEY), arr = [];
            if (raw) {
                try { arr = JSON.parse(raw) || []; } catch (e) { console.warn('parse', e); }
            }
            if (!Array.isArray(arr)) { arr = []; }
            this._cache = arr;
            return arr.slice();
        },
        save: function (list) {
            this._cache = Array.isArray(list) ? list.slice() : [];
            lsSet(STORAGE_KEY, JSON.stringify(this._cache));
            return this._cache.slice();
        },
        all: function () { return this.load(); },
        upsert: function (entry) {
            var list = this.load(), i, idx = -1, now = new Date().toISOString();
            for (i = 0; i < list.length; i += 1) { if (list[i].id === entry.id) { idx = i; break; } }
            if (idx >= 0) {
                var updated = merge(list[idx], entry, { updated_at: now });
                list[idx] = updated;
            } else {
                var fresh = merge(entry, { id: entry.id || uid(), created_at: now, updated_at: now });
                list.push(fresh);
            }
            return this.save(list);
        },
        remove: function (id) {
            var src = this.load(), out = [], i;
            for (i = 0; i < src.length; i += 1) { if (src[i].id !== id) { out.push(src[i]); } }
            return this.save(out);
        },
        clear: function () { return this.save([]); }
    };

    function merge() { // shallow merge objects
        var out = {}, i, obj, k;
        for (i = 0; i < arguments.length; i += 1) {
            obj = arguments[i]; if (!obj) { continue; }
            for (k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) { out[k] = obj[k]; } }
        }
        return out;
    }

    // ---------------- View ----------------
    function rowHTML(e) {
        var am = (e.am_sys || e.am_dia || e.am_hr) ? (e.am_sys || '') + '/' + (e.am_dia || '') + ' · ' + (e.am_hr || '') : '';
        var pm = (e.pm_sys || e.pm_dia || e.pm_hr) ? (e.pm_sys || '') + '/' + (e.pm_dia || '') + ' · ' + (e.pm_hr || '') : '';
        return '' +
        '<tr data-id="' + e.id + '">' +
            '<td>' + escapeHTML(e.date || '') + '</td>' +
            '<td>' + escapeHTML(e.time || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.dose || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.pain || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.sedation || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.dizziness || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.nausea || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.brainfog || '') + '</td>' +
            '<td class="num">' + escapeHTML(e.sleep || '') + '</td>' +
            '<td>' + escapeHTML(e.appetite || '') + '</td>' +
            '<td>' + escapeHTML((e.effects || []).join(', ')) + '</td>' +
            '<td>' + escapeHTML(am) + '</td>' +
            '<td>' + escapeHTML(pm) + '</td>' +
            '<td>' + escapeHTML(e.notes || '') + '</td>' +
            '<td class="actions-col">' +
                '<button type="button" data-action="edit" class="btn btn-sm btn-outline-secondary">Edit</button> ' +
                '<button type="button" data-action="del" class="btn btn-sm btn-outline-danger">Del</button>' +
            '</td>' +
        '</tr>';
    }

    function render() {
        var tbody = document.querySelector('#entriesTable tbody');
        if (!tbody) { return; }
        var list = Store.all().slice().sort(function (a, b) {
            var da = new Date(a.date + 'T' + (a.time || '00:00')), db = new Date(b.date + 'T' + (b.time || '00:00'));
            return db - da;
        });
        var i, html = '';
        for (i = 0; i < list.length; i += 1) { html += rowHTML(list[i]); }
        tbody.innerHTML = html;
    }

    // ---------------- Controller ----------------
    function gatherForm() {
        var get = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var appetite = (function () {
            var el = document.querySelector('input[name="appetite"]:checked');
            return el ? el.value : '';
        }());
        var effects = [];
        var boxes = ['fx_itch','fx_vision','fx_headache','fx_gi'];
        var i, el;
        for (i = 0; i < boxes.length; i += 1) {
            el = document.getElementById(boxes[i]);
            if (el && el.checked) { effects.push(el.value); }
        }
        return {
            date: get('date'),
            time: get('time'),
            dose: get('dose'),
            pain: get('pain'),
            sedation: get('sedation'),
            dizziness: get('dizziness'),
            nausea: get('nausea'),
            brainfog: get('brainfog'),
            sleep: get('sleep'),
            appetite: appetite,
            effects: effects,
            am_sys: get('am_sys'),
            am_dia: get('am_dia'),
            am_hr:  get('am_hr'),
            pm_sys: get('pm_sys'),
            pm_dia: get('pm_dia'),
            pm_hr:  get('pm_hr'),
            notes: get('notes')
        };
    }

    function clearFormTodayOnly() {
        var t = todayISO();
        var f = document.getElementById('entryForm');
        if (!f) { return; }
        if (document.getElementById('date')) { document.getElementById('date').value = t; }
        if (document.getElementById('time')) { document.getElementById('time').value = ''; }
        var ids = ['dose','pain','sedation','dizziness','nausea','brainfog','sleep','notes',
                   'am_sys','am_dia','am_hr','pm_sys','pm_dia','pm_hr'];
        var i, el;
        for (i = 0; i < ids.length; i += 1) {
            el = document.getElementById(ids[i]);
            if (el) { el.value = (ids[i] === 'sleep') ? '7' : ''; }
        }
        var radios = document.querySelectorAll('input[name="appetite"]');
        for (i = 0; i < radios.length; i += 1) { if (radios[i].id === 'app_norm') { radios[i].checked = true; } else { radios[i].checked = false; } }
        var cbs = ['fx_itch','fx_vision','fx_headache','fx_gi'];
        for (i = 0; i < cbs.length; i += 1) { el = document.getElementById(cbs[i]); if (el) { el.checked = false; } }
        // update displayed range outputs
        var map = [
            ['dose','out_dose'], ['pain','out_pain'], ['sedation','out_sedation'],
            ['dizziness','out_dizziness'], ['nausea','out_nausea'], ['brainfog','out_brainfog'],
            ['sleep','out_sleep']
        ];
        for (i = 0; i < map.length; i += 1) {
            var v = document.getElementById(map[i][0]), out = document.getElementById(map[i][1]);
            if (v && out) { out.textContent = v.value; }
        }
    }

    function addHandlers() {
        // form submit -> save
        var form = document.getElementById('entryForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var data = gatherForm();
                if (!data.date) { alert('Please select a Date.'); return; }
                if (!data.time) { alert('Please select a Time.'); return; }
                var entry = merge(data, { id: uid() });
                Store.upsert(entry);
                render();
                alert('Saved.');
            });
        }

        // table actions
        var table = document.getElementById('entriesTable') || document;
        table.addEventListener('click', function (e) {
            var t = e.target;
            if (!t || !t.getAttribute) { return; }
            var act = t.getAttribute('data-action'); if (!act) { return; }
            var tr = t.closest && t.closest('tr[data-id]'); var id;
            if (!tr) {
                var p = t;
                while (p && p !== document && (!p.getAttribute || !p.getAttribute('data-id'))) { p = p.parentNode; }
                tr = (p && p.getAttribute) ? p : null;
            }
            id = tr && tr.getAttribute('data-id'); if (!id) { return; }

            if (act === 'del') {
                if (confirm('Delete this entry?')) {
                    Store.remove(id); render();
                }
            } else if (act === 'edit') {
                // simple prompt-based edit
                var list = Store.all(), i, item = null;
                for (i = 0; i < list.length; i += 1) { if (list[i].id === id) { item = list[i]; break; } }
                if (!item) { return; }
                var date = prompt('Date (YYYY-MM-DD):', item.date || '') || item.date;
                var time = prompt('Time (HH:MM):', item.time || '') || item.time;
                var dose = prompt('Dose (mg):', item.dose || '') || item.dose;
                var notes = prompt('Notes:', item.notes || '') || item.notes;
                Store.upsert(merge(item, { date: date, time: time, dose: dose, notes: notes }));
                render();
            }
        });

        // toolbar buttons
        var btnJson = document.getElementById('btn-export-json');
        if (btnJson) { btnJson.onclick = function () { download('carbamazepine_entries.json', 'application/json', JSON.stringify(Store.all(), null, 2)); }; }

        var btnCsv = document.getElementById('btn-export-csv');
        if (btnCsv) { btnCsv.onclick = function () { download('carbamazepine_entries.csv', 'text/csv;charset=utf-8', toCSV(Store.all())); }; }

        var btnClearAll = document.getElementById('btn-clear-all');
        if (btnClearAll) { btnClearAll.onclick = function () { if (confirm('Clear ALL entries?')) { Store.clear(); render(); } }; }

        var btnClearToday = document.getElementById('btn-clear-today');
        if (btnClearToday) { btnClearToday.onclick = function () { clearFormTodayOnly(); }; }

        var btnImport = document.getElementById('btn-import-json');
        var inputFile = document.getElementById('import-file');
        if (btnImport && inputFile) {
            btnImport.onclick = function () { inputFile.click(); };
            inputFile.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0]; if (!file) { return; }
                var reader = new FileReader();
                reader.onload = function () {
                    try {
                        var arr = JSON.parse(reader.result);
                        if (Array.isArray(arr)) {
                            // naive merge by id, newest updated_at wins if present
                            var current = Store.all(), map = {}, i;
                            for (i = 0; i < current.length; i += 1) { map[current[i].id] = current[i]; }
                            for (i = 0; i < arr.length; i += 1) {
                                var n = arr[i], cur = map[n.id];
                                if (!cur) { map[n.id] = n; }
                                else {
                                    var tOld = new Date(cur.updated_at || 0).getTime();
                                    var tNew = new Date(n.updated_at || 0).getTime();
                                    map[n.id] = (tNew >= tOld) ? n : cur;
                                }
                            }
                            var out = [], k, keys = Object.keys(map);
                            for (i = 0; i < keys.length; i += 1) { k = keys[i]; out.push(map[k]); }
                            Store.save(out); render();
                            alert('Import complete.');
                        } else {
                            alert('Invalid JSON: expected an array.');
                        }
                    } catch (ex) {
                        console.warn('import', ex); alert('Bad JSON.');
                    }
                };
                reader.readAsText(file); e.target.value = '';
            });
        }

        // optional buttons (present in your HTML)
        var btnSafe = document.getElementById('btn-safe-export');
        if (btnSafe) {
            btnSafe.onclick = function () {
                // in-page safe export == simply export current + message; replace with repo-merge if you later wire GitHub API.
                download('carbamazepine_entries.json', 'application/json', JSON.stringify(Store.all(), null, 2));
                alert('Safe Export: current local data exported. (Repo merge not configured on this page.)');
            };
        }
        var btnSnap = document.getElementById('btn-archive-snapshot');
        if (btnSnap) {
            btnSnap.onclick = function () {
                var ts = new Date().toISOString().replace(/[:.]/g, '-');
                download('carbamazepine_snapshot_' + ts + '.json', 'application/json', JSON.stringify(Store.all(), null, 2));
            };
        }

        // data source select (placeholder)
        var sel = document.getElementById('data-source');
        if (sel) {
            sel.addEventListener('change', function () {
                if (sel.value === 'local') {
                    render();
                } else if (sel.value === 'repo' || sel.value === 'merged') {
                    alert('Repo/Merged sources are not wired in this standalone page.');
                    sel.value = 'local';
                }
            });
        }
    }

    // ---------------- Init ----------------
    function init() {
        // default date to today if empty
        var d = document.getElementById('date');
        if (d && !d.value) { d.value = todayISO(); }
        addHandlers();
        render();
    }

    // start after DOM ready
    document.addEventListener('DOMContentLoaded', init);
}());
