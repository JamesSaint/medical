/*jslint browser: true, devel: true */
/*global window, document, Blob, URL, FileReader, alert, confirm, prompt */

(function () {
    'use strict';

    // ---------------- Config ----------------
    var STORAGE_KEY = 'carbamazepine_entries_v2';

    // ---------------- Utilities ----------------
    function lsGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage get failed', e);
            return null;
        }
    }

    function lsSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('localStorage set failed', e);
            return false;
        }
    }

    function uid() {
        var buffer;
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            buffer = new Uint32Array(4);
            window.crypto.getRandomValues(buffer);
            return 'id-' + Array.prototype.map.call(buffer, function (x) {
                return ('00000000' + x.toString(16)).slice(-8);
            }).join('');
        }
        return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    function escapeHTML(s) {
        var str;
        if (s === null || s === undefined) {
            return '';
        }
        str = String(s);
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        return str;
    }

    function toCSV(rows) {
        var headers;
        var head;
        var body;

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

        if (!rows || rows.length === 0) {
            return '';
        }

        headers = Object.keys(rows[0]);
        head = headers.map(esc).join(',');
        body = rows.map(function (r) {
            return headers.map(function (h) {
                return esc(r[h]);
            }).join(',');
        }).join('\n');

        return head + '\n' + body;
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

    function todayISO() {
        var d = new Date();
        var m = String(d.getMonth() + 1);
        var day = String(d.getDate());

        if (m.length === 1) {
            m = '0' + m;
        }
        if (day.length === 1) {
            day = '0' + day;
        }
        return d.getFullYear() + '-' + m + '-' + day;
    }

    // Shallow-merge an array of plain objects into a new object (left -> right)
    function mergeArray(objs) {
        var out = {};
        var i;
        var keys;
        var j;
        var k;

        for (i = 0; i < objs.length; i += 1) {
            if (objs[i]) {
                keys = Object.keys(objs[i]);
                for (j = 0; j < keys.length; j += 1) {
                    k = keys[j];
                    out[k] = objs[i][k];
                }
            }
        }
        return out;
    }

    // ---------------- Store ----------------
    var Store = (function () {
        var cache = null;

        function load() {
            var raw;
            var arr;

            if (cache) {
                return cache.slice();
            }

            raw = lsGet(STORAGE_KEY);
            arr = [];

            if (raw) {
                try {
                    arr = JSON.parse(raw);
                } catch (e) {
                    console.warn('parse', e);
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
            lsSet(STORAGE_KEY, JSON.stringify(cache));
            return cache.slice();
        }

        function all() {
            return load();
        }

        function upsert(entry) {
            var list = load();
            var idx = -1;
            var i;
            var now = new Date().toISOString();
            var combined;

            for (i = 0; i < list.length; i += 1) {
                if (list[i].id === entry.id) {
                    idx = i;
                    break;
                }
            }

            if (idx >= 0) {
                combined = mergeArray([list[idx], entry, {updated_at: now}]);
                list[idx] = combined;
            } else {
                combined = mergeArray([entry, {id: entry.id || uid(), created_at: now, updated_at: now}]);
                list.push(combined);
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

    // ---------------- View ----------------
    function rowHTML(e) {
        var am = '';
        var pm = '';
        var parts;
        var effectsText;

        if (e.am_sys || e.am_dia || e.am_hr) {
            parts = [e.am_sys || '', '/', e.am_dia || '', ' · ', e.am_hr || ''];
            am = parts.join('');
        }
        if (e.pm_sys || e.pm_dia || e.pm_hr) {
            parts = [e.pm_sys || '', '/', e.pm_dia || '', ' · ', e.pm_hr || ''];
            pm = parts.join('');
        }

        if (e.effects && e.effects.length) {
            effectsText = e.effects.join(', ');
        } else {
            effectsText = '';
        }

        return (
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
                '<td>' + escapeHTML(effectsText) + '</td>' +
                '<td>' + escapeHTML(am) + '</td>' +
                '<td>' + escapeHTML(pm) + '</td>' +
                '<td>' + escapeHTML(e.notes || '') + '</td>' +
                '<td class="actions-col">' +
                    '<button type="button" data-action="edit" class="btn btn-sm btn-outline-secondary">Edit</button> ' +
                    '<button type="button" data-action="del" class="btn btn-sm btn-outline-danger">Del</button>' +
                '</td>' +
            '</tr>'
        );
    }

    function render() {
        var tbody = document.querySelector('#entriesTable tbody');
        var list;
        var html = '';
        var i;
        var ta;
        var tb;

        if (!tbody) {
            return;
        }

        list = Store.all().slice().sort(function (a, b) {
            ta = new Date((a.date || '1970-01-01') + 'T' + (a.time || '00:00')).getTime();
            tb = new Date((b.date || '1970-01-01') + 'T' + (b.time || '00:00')).getTime();
            return tb - ta;
        });

        for (i = 0; i < list.length; i += 1) {
            html += rowHTML(list[i]);
        }
        tbody.innerHTML = html;
    }

    // ---------------- Controller ----------------
    function gatherForm() {
        function get(id) {
            var el = document.getElementById(id);
            if (el) {
                return el.value;
            }
            return '';
        }

        var appetiteEl = document.querySelector('input[name="appetite"]:checked');
        var appetite = '';
        if (appetiteEl && appetiteEl.value) {
            appetite = appetiteEl.value;
        }

        var effects = [];
        var boxes = ['fx_itch', 'fx_vision', 'fx_headache', 'fx_gi'];
        var i;
        var el;

        for (i = 0; i < boxes.length; i += 1) {
            el = document.getElementById(boxes[i]);
            if (el && el.checked) {
                effects.push(el.value);
            }
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
            am_hr: get('am_hr'),
            pm_sys: get('pm_sys'),
            pm_dia: get('pm_dia'),
            pm_hr: get('pm_hr'),
            notes: get('notes')
        };
    }

    function clearFormTodayOnly() {
        var t = todayISO();
        var f = document.getElementById('entryForm');
        var ids;
        var i;
        var el;
        var radios;
        var cbs;
        var map;
        var v;
        var out;

        if (!f) {
            return;
        }

        el = document.getElementById('date');
        if (el) {
            el.value = t;
        }
        el = document.getElementById('time');
        if (el) {
            el.value = '';
        }

        ids = ['dose', 'pain', 'sedation', 'dizziness', 'nausea', 'brainfog', 'sleep', 'notes', 'am_sys', 'am_dia', 'am_hr', 'pm_sys', 'pm_dia', 'pm_hr'];
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
            if (radios[i].id === 'app_norm') {
                radios[i].checked = true;
            } else {
                radios[i].checked = false;
            }
        }

        cbs = ['fx_itch', 'fx_vision', 'fx_headache', 'fx_gi'];
        for (i = 0; i < cbs.length; i += 1) {
            el = document.getElementById(cbs[i]);
            if (el) {
                el.checked = false;
            }
        }

        map = [
            ['dose', 'out_dose'],
            ['pain', 'out_pain'],
            ['sedation', 'out_sedation'],
            ['dizziness', 'out_dizziness'],
            ['nausea', 'out_nausea'],
            ['brainfog', 'out_brainfog'],
            ['sleep', 'out_sleep']
        ];
        v = null;
        out = null;
        for (i = 0; i < map.length; i += 1) {
            v = document.getElementById(map[i][0]);
            out = document.getElementById(map[i][1]);
            if (v && out) {
                out.textContent = v.value;
            }
        }
    }

    function addHandlers() {
        var form = document.getElementById('entryForm');
        var tableEl = document.getElementById('entriesTable');

        if (!tableEl) {
            tableEl = document;
        }

        if (form) {
            form.addEventListener('submit', function (e) {
                var data;
                var entry;

                e.preventDefault();

                data = gatherForm();
                if (!data.date) {
                    alert('Please select a Date.');
                    return;
                }
                if (!data.time) {
                    alert('Please select a Time.');
                    return;
                }

                entry = mergeArray([data, {id: uid()}]);
                Store.upsert(entry);
                render();
                alert('Saved.');
            });
        }

        tableEl.addEventListener('click', function (e) {
            var t = e.target;
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

            if (t.closest && t.closest('tr[data-id]')) {
                tr = t.closest('tr[data-id]');
            } else {
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

            id = tr && tr.getAttribute('data-id');
            if (!id) {
                return;
            }

            if (act === 'del') {
                if (confirm('Delete this entry?')) {
                    Store.remove(id);
                    render();
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

                date = prompt('Date (YYYY-MM-DD):', item.date || '');
                if (date === null) {
                    return;
                }
                if (date === '') {
                    date = item.date;
                }

                time = prompt('Time (HH:MM):', item.time || '');
                if (time === null) {
                    return;
                }
                if (time === '') {
                    time = item.time;
                }

                dose = prompt('Dose (mg):', item.dose || '');
                if (dose === null) {
                    return;
                }
                if (dose === '') {
                    dose = item.dose;
                }

                notes = prompt('Notes:', item.notes || '');
                if (notes === null) {
                    return;
                }
                if (notes === '') {
                    notes = item.notes;
                }

                Store.upsert(mergeArray([item, {date: date, time: time, dose: dose, notes: notes}]));
                render();
            }
        });

        // Toolbar
        (function () {
            var btnJson = document.getElementById('btn-export-json');
            var btnCsv = document.getElementById('btn-export-csv');
            var btnClearAll = document.getElementById('btn-clear-all');
            var btnClearToday = document.getElementById('btn-clear-today');
            var btnImport = document.getElementById('btn-import-json');
            var inputFile = document.getElementById('import-file');

            if (btnJson) {
                btnJson.onclick = function () {
                    var content = JSON.stringify(Store.all(), null, 2);
                    download('carbamazepine_entries.json', 'application/json', content);
                };
            }

            if (btnCsv) {
                btnCsv.onclick = function () {
                    var csv = toCSV(Store.all());
                    download('carbamazepine_entries.csv', 'text/csv;charset=utf-8', csv);
                };
            }

            if (btnClearAll) {
                btnClearAll.onclick = function () {
                    if (confirm('Clear ALL entries?')) {
                        Store.clear();
                        render();
                    }
                };
            }

            if (btnClearToday) {
                btnClearToday.onclick = function () {
                    clearFormTodayOnly();
                };
            }

            if (btnImport && inputFile) {
                btnImport.onclick = function () {
                    inputFile.click();
                };
                inputFile.addEventListener('change', function (e) {
                    var file = e.target.files && e.target.files[0];
                    var reader;
                    var arr;
                    var current;
                    var map;
                    var i;
                    var n;
                    var cur;
                    var tOld;
                    var tNew;
                    var out;
                    var keys;
                    var k;

                    if (!file) {
                        return;
                    }

                    reader = new FileReader();
                    reader.onload = function () {
                        try {
                            arr = JSON.parse(reader.result);

                            if (Array.isArray(arr)) {
                                current = Store.all();
                                map = {};

                                for (i = 0; i < current.length; i += 1) {
                                    map[current[i].id] = current[i];
                                }

                                for (i = 0; i < arr.length; i += 1) {
                                    n = arr[i];
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

                                out = [];
                                keys = Object.keys(map);
                                for (i = 0; i < keys.length; i += 1) {
                                    k = keys[i];
                                    out.push(map[k]);
                                }

                                Store.save(out);
                                render();
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
                    e.target.value = '';
                });
            }
        }());
    }

    // ---------------- Init ----------------
    function init() {
        var d = document.getElementById('date');
        if (d && !d.value) {
            d.value = todayISO();
        }
        addHandlers();
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
}());
