/*jslint browser: true */
/*global document, window, Blob, URL, fetch, FileReader, alert, confirm, console */
(function () {
    'use strict';

    // ---------------- Config ----------------
    var STORAGE_KEY = 'carbamazepine_entries_v2';
    var REPO_JSON_CANDIDATES = [
        '/medical/neurological/carbamazepine-entries.json',
        '/medical/neurological/data/carbamazepine-entries.json',
        '/medical/neurological/carbamazepine.json',
        '/medical/neurological/data/carbamazepine.json',
        'https://raw.githubusercontent.com/JamesSaint/medical/main/neurological/carbamazepine-entries.json',
        'https://raw.githubusercontent.com/JamesSaint/medical/main/neurological/data/carbamazepine-entries.json',
        'https://raw.githubusercontent.com/JamesSaint/medical/main/neurological/carbamazepine.json',
        'https://raw.githubusercontent.com/JamesSaint/medical/main/neurological/data/carbamazepine.json'
    ];

    // ---------------- Utilities ----------------
    function safeGet(k) {
        var v = null;
        try {
            v = window.localStorage.getItem(k);
        } catch (e) {
            console.warn('localStorage get failed', e);
        }
        return v;
    }

    function safeSet(k, v) {
        var ok = true;
        try {
            window.localStorage.setItem(k, v);
        } catch (e) {
            console.warn('localStorage set failed', e);
            ok = false;
        }
        return ok;
    }

    function uid() {
        var b;
        var i;
        var out = '';
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            b = new Uint32Array(4);
            window.crypto.getRandomValues(b);
            for (i = 0; i < b.length; i += 1) {
                out += ('00000000' + b[i].toString(16)).slice(-8);
            }
            return 'id-' + out;
        }
        return 'id-' + String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    }

    function todayISO() {
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1);
        var day = String(d.getDate());

        if (m.length === 1) {
            m = '0' + m;
        }
        if (day.length === 1) {
            day = '0' + day;
        }
        return y + '-' + m + '-' + day;
    }

    function escHTML(s) {
        var txt;
        if (s === null || s === undefined) {
            return '';
        }
        txt = String(s);
        txt = txt.replace(/&/g, '&amp;');
        txt = txt.replace(/</g, '&lt;');
        txt = txt.replace(/>/g, '&gt;');
        txt = txt.replace(/"/g, '&quot;');
        return txt;
    }

    function download(filename, mime, content) {
        var blob = new Blob([content], {type: mime});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 250);
    }

    function toCSV(rows) {
        var headers;
        var head;
        var body;

        if (!rows || !rows.length) {
            return '';
        }

        headers = Object.keys(rows[0]);

        function esc(v) {
            var s;
            if (v === null || v === undefined) {
                return '';
            }
            s = String(v);
            if (/[",\n]/.test(s)) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        }

        head = headers.map(esc).join(',');
        body = rows.map(function (r) {
            return headers.map(function (h) {
                return esc(r[h]);
            }).join(',');
        }).join('\n');

        return head + '\n' + body;
    }

    function merge(a, b, c) {
        var out = {};
        var srcs = [];
        var i;
        var obj;
        var keys;
        var j;
        var k;

        if (a) {
            srcs.push(a);
        }
        if (b) {
            srcs.push(b);
        }
        if (c) {
            srcs.push(c);
        }

        for (i = 0; i < srcs.length; i += 1) {
            obj = srcs[i];
            keys = Object.keys(obj);
            for (j = 0; j < keys.length; j += 1) {
                k = keys[j];
                out[k] = obj[k];
            }
        }
        return out;
    }

    // ---------------- Store ----------------
    var Store = (function () {
        var cache = null;

        function load() {
            var raw;
            var arr = [];

            if (cache) {
                return cache.slice();
            }

            raw = safeGet(STORAGE_KEY);
            if (raw) {
                try {
                    arr = JSON.parse(raw) || [];
                } catch (e) {
                    console.warn('JSON parse', e);
                }
            }
            if (!Array.isArray(arr)) {
                arr = [];
            }
            cache = arr;
            return arr.slice();
        }

        function save(list) {
            if (Array.isArray(list)) {
                cache = list.slice();
            } else {
                cache = [];
            }
            safeSet(STORAGE_KEY, JSON.stringify(cache));
            return cache.slice();
        }

        function all() {
            return load();
        }

        function upsert(entry) {
            var list = load();
            var i;
            var idx = -1;
            var now = new Date().toISOString();
            var updated;
            var fresh;

            for (i = 0; i < list.length; i += 1) {
                if (list[i].id === entry.id) {
                    idx = i;
                    break;
                }
            }
            if (idx >= 0) {
                updated = merge(list[idx], entry, {updated_at: now});
                list[idx] = updated;
            } else {
                fresh = merge(entry, {id: entry.id || uid(), created_at: now, updated_at: now});
                list.push(fresh);
            }
            return save(list);
        }

        function remove(id) {
            var src = load();
            var out = [];
            var i;

            for (i = 0; i < src.length; i += 1) {
                if (src[i].id !== id) {
                    out.push(src[i]);
                }
            }
            return save(out);
        }

        function clear() {
            return save([]);
        }

        return {
            load: load,
            save: save,
            all: all,
            upsert: upsert,
            remove: remove,
            clear: clear
        };
    }());

    // ---------------- Repo loader ----------------
    function fetchFirstAvailableJSON(callback) {
        var i = 0;

        function next() {
            var url;

            if (i >= REPO_JSON_CANDIDATES.length) {
                callback(new Error('not found'), []);
                return;
            }

            url = REPO_JSON_CANDIDATES[i];
            i += 1;

            fetch(url, {cache: 'no-store', mode: 'cors'})
                .then(function (res) {
                    if (!res.ok) {
                        throw new Error('HTTP ' + res.status);
                    }
                    return res.json();
                })
                .then(function (data) {
                    if (!Array.isArray(data)) {
                        data = [];
                    }
                    callback(null, data);
                })
                .catch(function () {
                    next();
                });
        }

        next();
    }

    function mergeByMostRecent(a, b) {
        var map = {};
        var i;
        var n;
        var cur;
        var tOld;
        var tNew;
        var keys;
        var j;
        var k;
        var out = [];

        for (i = 0; i < a.length; i += 1) {
            map[a[i].id] = a[i];
        }

        for (i = 0; i < b.length; i += 1) {
            n = b[i];
            cur = map[n.id];

            if (!cur) {
                map[n.id] = n;
            } else {
                tOld = new Date(cur.updated_at || 0).getTime();
                tNew = new Date(n.updated_at || 0).getTime();

                if (tNew >= tOld) {
                    map[n.id] = n;
                } else {
                    map[n.id] = cur;
                }
            }
        }

        keys = Object.keys(map);
        for (j = 0; j < keys.length; j += 1) {
            k = keys[j];
            out.push(map[k]);
        }
        return out;
    }

    // ---------------- Row + Render ----------------
    function rowHTML(e) {
        var am = '';
        var pm = '';
        var effectsStr = '';
        var html = '';

        if (e.am_sys || e.am_dia || e.am_hr) {
            am = escHTML(e.am_sys || '') + '/' + escHTML(e.am_dia || '') + ' · ' + escHTML(e.am_hr || '');
        }
        if (e.pm_sys || e.pm_dia || e.pm_hr) {
            pm = escHTML(e.pm_sys || '') + '/' + escHTML(e.pm_dia || '') + ' · ' + escHTML(e.pm_hr || '');
        }
        if (Array.isArray(e.effects)) {
            effectsStr = e.effects.join(', ');
        }

        html += '<tr data-id="' + escHTML(e.id) + '">';
        html += '<td>' + escHTML(e.date || '') + '</td>';
        html += '<td>' + escHTML(e.time || '') + '</td>';
        html += '<td class="num">' + escHTML(e.dose || '') + '</td>';
        html += '<td class="num">' + escHTML(e.pain || '') + '</td>';
        html += '<td class="num">' + escHTML(e.sedation || '') + '</td>';
        html += '<td class="num">' + escHTML(e.dizziness || '') + '</td>';
        html += '<td class="num">' + escHTML(e.nausea || '') + '</td>';
        html += '<td class="num">' + escHTML(e.brainfog || '') + '</td>';
        html += '<td class="num">' + escHTML(e.sleep || '') + '</td>';
        html += '<td>' + escHTML(e.appetite || '') + '</td>';
        html += '<td>' + escHTML(effectsStr) + '</td>';
        html += '<td>' + escHTML(am) + '</td>';
        html += '<td>' + escHTML(pm) + '</td>';
        html += '<td>' + escHTML(e.notes || '') + '</td>';
        html += '<td class="actions-col"><button data-action="edit">Edit</button> <button data-action="delete">Del</button></td>';
        html += '</tr>';

        return html;
    }

    function render(list) {
        var tbody = document.getElementById('entriesBody');
        var copy = [];
        var i;
        var html = '';
        var countEl;

        if (!tbody) {
            return;
        }

        if (Array.isArray(list)) {
            copy = list.slice();
        }

        copy.sort(function (a, b) {
            var da = new Date((a.date || '') + 'T' + (a.time || '00:00')).getTime() || 0;
            var db = new Date((b.date || '') + 'T' + (b.time || '00:00')).getTime() || 0;
            return db - da;
        });

        for (i = 0; i < copy.length; i += 1) {
            html += rowHTML(copy[i]);
        }

        tbody.innerHTML = html;
        countEl = document.getElementById('countLocal');
        if (countEl) {
            countEl.textContent = String(copy.length);
        }
    }

    // ---------------- Form helpers ----------------
    function clearFormTodayOnly() {
        var t = todayISO();
        var d = document.getElementById('date');
        var ids = [
            'time', 'dose', 'pain', 'sedation', 'dizziness', 'nausea', 'brainfog', 'sleep', 'notes',
            'am_sys', 'am_dia', 'am_hr', 'pm_sys', 'pm_dia', 'pm_hr'
        ];
        var i;
        var el;
        var radios;
        var cbs;

        if (d && !d.value) {
            d.value = t;
        }

        for (i = 0; i < ids.length; i += 1) {
            el = document.getElementById(ids[i]);
            if (el) {
                if (ids[i] === 'sleep') {
                    el.value = '7';
                } else {
                    el.value = '';
                }
            }
        }

        radios = document.querySelectorAll('input[name="appetite"]');
        for (i = 0; i < radios.length; i += 1) {
            radios[i].checked = (radios[i].id === 'app_norm');
        }

        cbs = ['fx_itch', 'fx_vision', 'fx_headache', 'fx_gi'];
        for (i = 0; i < cbs.length; i += 1) {
            el = document.getElementById(cbs[i]);
            if (el) {
                el.checked = false;
            }
        }
    }

    // ---------------- Data I/O (simple) ----------------
    function readForm() {
        var get = function (id) {
            var el = document.getElementById(id);
            if (el) {
                return el.value;
            }
            return '';
        };

        var boxes = ['fx_itch', 'fx_vision', 'fx_headache', 'fx_gi'];
        var effects = [];
        var i;
        var el;
        var appetiteValue = '';

        for (i = 0; i < boxes.length; i += 1) {
            el = document.getElementById(boxes[i]);
            if (el && el.checked) {
                effects.push(el.value);
            }
        }

        el = document.querySelector('input[name="appetite"]:checked');
        if (el) {
            appetiteValue = el.value;
        } else {
            appetiteValue = '';
        }

        return {
            id: '',
            date: get('date'),
            time: get('time'),
            dose: get('dose'),
            pain: get('pain'),
            sedation: get('sedation'),
            dizziness: get('dizziness'),
            nausea: get('nausea'),
            brainfog: get('brainfog'),
            sleep: get('sleep'),
            appetite: appetiteValue,
            effects: effects,
            am_sys: get('am_sys'),
            am_dia: get('am_dia'),
            am_hr: get('am_hr'),
            pm_sys: get('pm_sys'),
            pm_dia: get('pm_dia'),
            pm_hr: get('pm_hr'),
            notes: get('notes')
        };
    }

    // ---------------- Init + Bind ----------------
    function bindUI() {
        var btnSave = document.getElementById('btn-save');
        var btnClearToday = document.getElementById('btn-clear-today');
        var btnClearAll = document.getElementById('btn-clear-all');
        var btnExportJSON = document.getElementById('btn-export-json');
        var btnExportCSV = document.getElementById('btn-export-csv');
        var btnImport = document.getElementById('btn-import-json');
        var inputFile = document.getElementById('input-file');
        var entriesTable = document.getElementById('entriesTable');
        var targetForClicks = entriesTable || document;

        render(Store.all());

        fetchFirstAvailableJSON(function (err, repo) {
            var merged;
            var countRepo;
            var countMerged;
            var repoCount = 0;

            if (err) {
                merged = Store.all();
            } else {
                merged = mergeByMostRecent(Store.all(), repo);
            }

            if (repo && repo.length) {
                repoCount = repo.length;
            } else {
                repoCount = 0;
            }

            countRepo = document.getElementById('countRepo');
            if (countRepo) {
                countRepo.textContent = String(repoCount);
            }

            countMerged = document.getElementById('countMerged');
            if (countMerged) {
                countMerged.textContent = String(merged.length);
            }
        });

        targetForClicks.addEventListener('click', function (e) {
            var t = e.target || e.srcElement;
            var act;
            var tr;
            var p;
            var id;
            var list;
            var i;
            var item;
            var date;
            var time;
            var dose;
            var notes;

            if (!t || !t.getAttribute) {
                return;
            }

            act = t.getAttribute('data-action');
            if (!act) {
                return;
            }

            if (t.closest && typeof t.closest === 'function') {
                tr = t.closest('tr[data-id]');
            }

            if (!tr) {
                p = t;
                while (p && p !== document && (!p.getAttribute || !p.getAttribute('data-id'))) {
                    p = p.parentNode;
                }
                if (p && p.getAttribute) {
                    tr = p;
                } else {
                    tr = null;
                }
            }

            if (tr && tr.getAttribute) {
                id = tr.getAttribute('data-id');
            } else {
                id = '';
            }

            if (!id) {
                return;
            }

            if (act === 'delete') {
                if (confirm('Delete entry?')) {
                    Store.remove(id);
                    render(Store.all());
                }
            } else if (act === 'edit') {
                list = Store.all();
                item = null;
                for (i = 0; i < list.length; i += 1) {
                    if (list[i].id === id) {
                        item = list[i];
                        break;
                    }
                }
                if (!item) {
                    return;
                }

                date = window.prompt('Date (YYYY-MM-DD):', item.date || '');
                if (date === null) {
                    return;
                }

                time = window.prompt('Time (HH:MM):', item.time || '');
                if (time === null) {
                    return;
                }

                dose = window.prompt('Dose (mg):', item.dose || '');
                if (dose === null) {
                    return;
                }

                notes = window.prompt('Notes:', item.notes || '');
                if (notes === null) {
                    return;
                }

                Store.upsert(merge(item, {
                    date: date,
                    time: time,
                    dose: dose,
                    notes: notes,
                    updated_at: new Date().toISOString()
                }));
                render(Store.all());
            }
        });

        if (btnSave) {
            btnSave.onclick = function () {
                var data = readForm();
                if (!data.date) {
                    alert('Please select a Date.');
                    return;
                }
                if (!data.time) {
                    alert('Please select a Time.');
                    return;
                }
                data.id = uid();
                data.created_at = new Date().toISOString();
                data.updated_at = data.created_at;
                Store.upsert(data);
                render(Store.all());
            };
        }

        if (btnClearToday) {
            btnClearToday.onclick = clearFormTodayOnly;
        }

        if (btnClearAll) {
            btnClearAll.onclick = function () {
                if (confirm('Clear ALL entries?')) {
                    Store.clear();
                    render(Store.all());
                }
            };
        }

        if (btnExportJSON) {
            btnExportJSON.onclick = function () {
                download('carbamazepine_entries.json', 'application/json', JSON.stringify(Store.all(), null, 2));
            };
        }

        if (btnExportCSV) {
            btnExportCSV.onclick = function () {
                download('carbamazepine_entries.csv', 'text/csv;charset=utf-8', toCSV(Store.all()));
            };
        }

        if (btnImport && inputFile) {
            btnImport.onclick = function () {
                inputFile.click();
            };

            inputFile.addEventListener('change', function (e2) {
                var file = null;
                var reader;

                if (e2 && e2.target && e2.target.files && e2.target.files[0]) {
                    file = e2.target.files[0];
                }

                if (!file) {
                    return;
                }

                reader = new FileReader();
                reader.onload = function () {
                    var arr;
                    var merged;

                    try {
                        arr = JSON.parse(reader.result);
                        if (Array.isArray(arr)) {
                            merged = mergeByMostRecent(Store.all(), arr);
                            Store.save(merged);
                            render(Store.all());
                            alert('Import complete.');
                        } else {
                            alert('Invalid JSON: expected an array.');
                        }
                    } catch (ex) {
                        console.warn('import', ex);
                        alert('Bad JSON.');
                    }
                };
                reader.readAsText(file);

                if (e2 && e2.target) {
                    e2.target.value = '';
                }
            });
        }

        // Keep helpers "used" for linters and handy in console.
        window.CarbamazepineTracker = {
            download: download,
            Store: Store,
            fetchFirstAvailableJSON: fetchFirstAvailableJSON,
            mergeByMostRecent: mergeByMostRecent,
            render: render,
            clearFormTodayOnly: clearFormTodayOnly
        };
    }

    function init() {
        var d = document.getElementById('date');
        var s = document.getElementById('sleep');

        if (d && !d.value) {
            d.value = todayISO();
        }
        if (s && !s.value) {
            s.value = '7';
        }
        bindUI();
    }

    document.addEventListener('DOMContentLoaded', init);
}());
