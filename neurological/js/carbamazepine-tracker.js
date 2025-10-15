/*jslint browser: true, devel: true, for: true */
/*global window, document, Element, Blob, URL, FileReader, alert, confirm, prompt */

function carbamazepineMain() {
    'use strict';

    // ---------------- Config ----------------
    var CONFIG = {
        STORAGE_KEY: 'carbamazepine_entries_v2',
        TABLE_ID: 'entries-table',
        TBODY_ID: 'entries-tbody',
        BTN_EXPORT_JSON: 'btn-export-json',
        BTN_EXPORT_CSV: 'btn-export-csv',
        BTN_IMPORT_JSON: 'btn-import-json',
        BTN_CLEAR_ALL: 'btn-clear-all',
        INPUT_FILE_ID: 'import-file'
    };

    // ---------------- Utilities ----------------
    function safeGetLocalStorage(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e1) {
            console.warn('localStorage get failed', e1);
            return null;
        }
    }

    function safeSetLocalStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
            return true;
        } catch (e2) {
            console.warn('localStorage set failed', e2);
            return false;
        }
    }

    function uid() {
        var buf;
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            buf = new Uint32Array(4);
            window.crypto.getRandomValues(buf);
            return 'id-' + Array.prototype.map.call(buf, function (x) {
                return ('00000000' + x.toString(16)).slice(-8);
            }).join('');
        }
        return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    function downloadBlob(filename, mime, content) {
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
        }, 1000);
    }

    function toCSV(rows) {
        var headers, head, body;

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

        if (!rows || !rows.length) {
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

    function escapeHTML(s) {
        if (s === null || s === undefined) {
            return '';
        }
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function shorten(s, n) {
        var str = String(s || '');
        if (str.length <= n) {
            return str;
        }
        return str.slice(0, n - 1) + '…';
    }

    // Merge array of objects -> new object
    function mergeArray(arr) {
        var out = {};
        var i = 0;
        var obj, keys, j, k;
        for (i = 0; i < arr.length; i += 1) {
            obj = arr[i];
            if (obj) {
                keys = Object.keys(obj);
                j = 0;
                for (j = 0; j < keys.length; j += 1) {
                    k = keys[j];
                    out[k] = obj[k];
                }
            }
        }
        return out;
    }

    // ---------------- Data layer ----------------
    var Store = (function () {
        var cache = null;

        function load() {
            var raw, arr;
            if (cache) {
                return cache.slice();
            }
            raw = safeGetLocalStorage(CONFIG.STORAGE_KEY);
            if (!raw) {
                cache = [];
                return [];
            }
            try {
                arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    cache = arr;
                } else {
                    cache = [];
                }
            } catch (e3) {
                console.warn('Bad JSON in storage', e3);
                return [];
            }
            return cache.slice();
        }

        function save(list) {
            if (Array.isArray(list)) {
                cache = list.slice();
            } else {
                cache = [];
            }
            safeSetLocalStorage(CONFIG.STORAGE_KEY, JSON.stringify(cache));
            return cache.slice();
        }

        function all() {
            return load();
        }

        function upsert(entry) {
            var list = load();
            var idx = -1;
            var i = 0;
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
            var i = 0;
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

    // ---------------- View layer ----------------
    var View = (function () {
        function getTbody() {
            var tbody = document.getElementById(CONFIG.TBODY_ID);
            var table, tb, created, newTable;
            if (tbody) {
                return tbody;
            }
            table = document.getElementById(CONFIG.TABLE_ID);
            if (table) {
                tb = table.getElementsByTagName('tbody')[0];
                if (tb) {
                    return tb;
                }
            }
            created = document.createElement('tbody');
            if (table) {
                table.appendChild(created);
                return created;
            }
            newTable = document.createElement('table');
            newTable.id = CONFIG.TABLE_ID;
            newTable.className = 'table table-striped table-bordered';
            newTable.innerHTML = '<thead><tr><th>Date/Time</th><th>Dose</th><th>Symptoms</th><th>Notes</th><th>Meta</th><th>Actions</th></tr></thead>';
            newTable.appendChild(created);
            document.body.appendChild(newTable);
            return created;
        }

        function rowHTML(e) {
            var meta = [];
            if (e.created_at) {
                meta.push('Created: ' + new Date(e.created_at).toLocaleString());
            }
            if (e.updated_at) {
                meta.push('Updated: ' + new Date(e.updated_at).toLocaleString());
            }
            if (e.device_id) {
                meta.push('Device: ' + e.device_id);
            }
            return '<tr data-id="' + e.id + '"><td>' + escapeHTML(shorten(e.date_time || '', 64)) + '</td><td>' + escapeHTML(e.dose_mg || '') + '</td><td>' + escapeHTML(shorten(e.symptoms || '', 140)) + '</td><td>' + escapeHTML(shorten(e.notes || '', 140)) + '</td><td>' + escapeHTML(meta.join(' | ')) + '</td><td><button data-action="edit">Edit</button> <button data-action="delete">Del</button></td></tr>';
        }

        function render(list) {
            var tbody = getTbody();
            var copy, html, i, ta, tb;
            if (!tbody) {
                return;
            }
            copy = list.slice().sort(function (a, b) {
                ta = new Date(a.date_time || a.created_at || 0).getTime();
                tb = new Date(b.date_time || b.created_at || 0).getTime();
                return tb - ta;
            });
            html = '';
            for (i = 0; i < copy.length; i += 1) {
                html += rowHTML(copy[i]);
            }
            tbody.innerHTML = html;
        }

        return {
            getTbody: getTbody,
            rowHTML: rowHTML,
            render: render
        };
    }());

    // ---------------- Controller ----------------
    function exportJSON() {
        var pretty = JSON.stringify(Store.all(), null, 2);
        downloadBlob('carbamazepine_entries.json', 'application/json', pretty);
    }

    function exportCSV() {
        var rows = Store.all();
        var csv = toCSV(rows);
        downloadBlob('carbamazepine_entries.csv', 'text/csv;charset=utf-8', csv);
    }

    function handleDelete(id) {
        if (confirm('Delete entry?')) {
            Store.remove(id);
            View.render(Store.all());
        }
    }

    function handleEdit(id) {
        var all = Store.all();
        var item = null;
        var i = 0;
        var dt, dose, sym, note, up;

        for (i = 0; i < all.length; i += 1) {
            if (all[i].id === id) {
                item = all[i];
                break;
            }
        }
        if (!item) {
            return;
        }

        dt = prompt('Date/time:', item.date_time || '');
        if (dt === null) {
            return;
        }
        dose = prompt('Dose:', item.dose_mg || '');
        if (dose === null) {
            return;
        }
        sym = prompt('Symptoms:', item.symptoms || '');
        if (sym === null) {
            return;
        }
        note = prompt('Notes:', item.notes || '');
        if (note === null) {
            return;
        }

        up = mergeArray([item, {date_time: dt, dose_mg: dose, symptoms: sym, notes: note}]);
        Store.upsert(up);
        View.render(Store.all());
    }

    function bindButtons() {
        var btnJson = document.getElementById(CONFIG.BTN_EXPORT_JSON);
        var btnCsv = document.getElementById(CONFIG.BTN_EXPORT_CSV);
        var btnImport = document.getElementById(CONFIG.BTN_IMPORT_JSON);
        var btnClear = document.getElementById(CONFIG.BTN_CLEAR_ALL);

        if (btnJson) {
            btnJson.onclick = function () {
                exportJSON();
            };
        }
        if (btnCsv) {
            btnCsv.onclick = function () {
                exportCSV();
            };
        }
        if (btnImport) {
            btnImport.onclick = function () {
                var f = document.getElementById(CONFIG.INPUT_FILE_ID);
                if (f) {
                    f.click();
                }
            };
        }
        if (btnClear) {
            btnClear.onclick = function () {
                if (confirm('Clear all entries?')) {
                    Store.clear();
                    View.render(Store.all());
                }
            };
        }
    }

    function bindTable() {
        var table = document.getElementById(CONFIG.TABLE_ID) || document;
        table.addEventListener('click', function (e) {
            var t = e.target;
            var act, tr, p, id;
            if (!t || !t.getAttribute) {
                return;
            }
            act = t.getAttribute('data-action');
            if (!act) {
                return;
            }
            tr = t.closest && t.closest('tr[data-id]');
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
            id = tr && tr.getAttribute('data-id');
            if (!id) {
                return;
            }
            if (act === 'delete') {
                handleDelete(id);
            } else if (act === 'edit') {
                handleEdit(id);
            }
        });
    }

    function mergeLists(oldArr, newArr) {
        var map = {};
        var i = 0;
        var n, cur, tOld, tNew, out, keys, j;

        for (i = 0; i < oldArr.length; i += 1) {
            map[oldArr[i].id] = oldArr[i];
        }
        for (i = 0; i < newArr.length; i += 1) {
            n = newArr[i];
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
        j = 0;
        for (j = 0; j < keys.length; j += 1) {
            out.push(map[keys[j]]);
        }
        return out;
    }

    function bindImport() {
        var input = document.getElementById(CONFIG.INPUT_FILE_ID);
        if (!input) {
            return;
        }
        input.addEventListener('change', function (e) {
            var file = e.target.files && e.target.files[0];
            var reader;
            var arr, merged;
            if (!file) {
                return;
            }
            reader = new FileReader();
            reader.onload = function () {
                try {
                    arr = JSON.parse(reader.result);
                    if (Array.isArray(arr)) {
                        merged = mergeLists(Store.all(), arr);
                        Store.save(merged);
                        View.render(Store.all());
                        alert('Import complete');
                    } else {
                        alert('Invalid JSON: expected an array');
                    }
                } catch (ex) {
                    console.warn('Import parse failed', ex);
                    alert('Bad JSON');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ---------------- Init ----------------
    function init() {
        bindButtons();
        bindTable();
        bindImport();
        View.render(Store.all());
    }

    init();
}

// ---------------- Bootstrap ----------------
function startCarbamazepine() {
    'use strict';
    carbamazepineMain();
}

document.addEventListener('DOMContentLoaded', startCarbamazepine);

