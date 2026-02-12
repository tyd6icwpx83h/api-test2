let responseData = [];      // 元のJSON
let filteredData = [];      // 検索・フィルタ後
let currentPage = 1;
const PAGE_SIZE = 2000;

$(document).ready(function() {
    
    // --- タブ切り替え ---
    $('.tab-btn').click(function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        const target = $(this).data('target');
        $('.tab-panel').removeClass('active');
        $('#' + target).addClass('active');
    });

    // --- 設定画面: 追加データ行の操作 ---
    $('#btn-add-kv').click(function() {
        const row = `<div class="kv-row">
            <input type="text" placeholder="Key" class="kv-key">
            <input type="text" placeholder="Value" class="kv-value">
            <button class="btn-remove-row"><i class="fas fa-times"></i></button>
        </div>`;
        $('#kv-container').append(row);
    });

    $(document).on('click', '.btn-remove-row', function() {
        $(this).closest('.kv-row').remove();
    });

    // --- 認証方式の切り替え表示 ---
    $('#auth-type').change(function() {
        const val = $(this).val();
        let html = '';
        if (val === 'bearer') html = '<input type="text" id="auth-token" placeholder="Bearer {token}">';
        if (val === 'basic') html = '<input type="text" id="auth-u" placeholder="User" style="width:48%"> <input type="password" id="auth-p" placeholder="Pass" style="width:48%; margin-left:2%">';
        if (val === 'apikey') html = '<input type="text" id="auth-header" placeholder="Header Name (e.g. X-API-KEY)" style="width:48%"> <input type="text" id="auth-token" placeholder="Key Value" style="width:48%; margin-left:2%">';
        if (val === 'jwt' || val === 'oauth') html = `<input type="text" id="auth-token" placeholder="${val.toUpperCase()} Token">`;
        $('#auth-fields').html(html);
    });

    // --- API送信処理 ---
    $('#btn-send').click(async function() {
        const url = $('#api-url').val();
        const method = $('#api-method').val();
        if (!url) return alert("URLを入力してください");

        showLoading(true);
        resetDisplay();

        // ヘッダー組み立て
        const headers = { 'Content-Type': 'application/json' };
        const authType = $('#auth-type').val();
        if (authType === 'bearer') headers['Authorization'] = $('#auth-token').val();
        else if (authType === 'basic') headers['Authorization'] = 'Basic ' + btoa($('#auth-u').val() + ':' + $('#auth-p').val());
        else if (authType === 'apikey') headers[$('#auth-header').val()] = $('#auth-token').val();
        else if (authType === 'jwt' || authType === 'oauth') headers['Authorization'] = 'Bearer ' + $('#auth-token').val();

        // ボディ組み立て
        let body = {};
        $('.kv-row').each(function() {
            const k = $(this).find('.kv-key').val();
            const v = $(this).find('.kv-value').val();
            if (k) body[k] = v;
        });

        try {
            const fetchOptions = { method, headers };
            if (['GET', 'HEAD'].indexOf(method) === -1) fetchOptions.body = JSON.stringify(body);

            const res = await fetch(url, fetchOptions);
            
            if (res.status !== 200) {
                showError(`Error ${res.status}: ${res.statusText}`);
                const text = await res.text();
                $('#raw-output').text(text).removeClass('hidden');
            } else {
                const json = await res.json();
                $('#raw-output').text(JSON.stringify(json, null, 4)).removeClass('hidden');
                initTable(json);
            }
        } catch (e) {
            showError("接続エラー: " + e.message);
        } finally {
            showLoading(false);
        }
    });

    // --- テーブル制御 ---
    function initTable(data) {
        responseData = Array.isArray(data) ? data : [data];
        filteredData = [...responseData];
        $('#search-filter-area').removeClass('hidden');
        
        // カラムフィルタ生成
        const keys = Object.keys(responseData[0]);
        $('#column-selectors').empty();
        keys.forEach(k => {
            $('#column-selectors').append(`<label><input type="checkbox" class="col-toggle" value="${k}" checked> ${k}</label>`);
        });

        renderTable();
    }

    function renderTable() {
        const visibleCols = $('.col-toggle:checked').map((_, el) => $(el).val()).get();
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageItems = filteredData.slice(start, end);

        let html = '<table><thead><tr>';
        visibleCols.forEach(c => html += `<th>${c}</th>`);
        html += '</tr></thead><tbody>';

        pageItems.forEach((row, i) => {
            html += `<tr data-idx="${start + i}">`;
            visibleCols.forEach(c => {
                const val = row[c] === undefined ? "" : row[c];
                html += `<td contenteditable="true" data-key="${c}">${val}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        $('#table-wrapper').html(html);
        updatePagination();
    }

    // 検索・フィルタリング
    $(document).on('input', '#table-search', function() {
        const query = $(this).val().toLowerCase();
        filteredData = responseData.filter(row => 
            Object.values(row).some(v => String(v).toLowerCase().includes(query))
        );
        currentPage = 1;
        renderTable();
    });

    $(document).on('change', '.col-toggle', renderTable);

    // 編集バリデーション
    $(document).on('input', 'td[contenteditable="true"]', function() {
        const $td = $(this);
        const text = $td.text().trim();
        const rowIdx = $td.closest('tr').data('idx');
        const key = $td.data('key');
        const original = String(filteredData[rowIdx][key] || "");

        $td.removeClass('cell-changed cell-error');
        if (text === "") $td.addClass('cell-error');
        else if (text !== original) $td.addClass('cell-changed');

        // 更新ボタン有効化チェック
        const hasError = $('.cell-error').length > 0;
        const hasChange = $('.cell-changed').length > 0;
        $('#btn-update').prop('disabled', hasError || !hasChange);
    });

    // CSV出力
    $('#btn-csv').click(function() {
        if (filteredData.length === 0) return;
        const keys = Object.keys(filteredData[0]);
        const csv = [
            keys.join(','),
            ...filteredData.map(row => keys.map(k => `"${String(row[k]).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api_export.csv';
        a.click();
    });

    // --- 補助関数 ---
    function showLoading(show) { $('#loader').toggleClass('hidden', !show); }
    function showError(msg) { $('#error-box').text(msg).removeClass('hidden'); }
    function resetDisplay() {
        $('#error-box, #raw-output, #search-filter-area').addClass('hidden');
        $('#table-wrapper, #pagination-controls').empty();
        $('#btn-update').prop('disabled', true);
    }
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
        const $pg = $('#pagination-controls').empty();
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            $pg.append(`<span class="page-link ${i === currentPage ? 'active' : ''}" data-p="${i}">${i}</span>`);
        }
    }
    $(document).on('click', '.page-link', function() {
        currentPage = parseInt($(this).data('p'));
        renderTable();
    });
    $('#btn-clear').click(resetDisplay);
});
