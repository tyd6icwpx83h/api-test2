// グローバルデータ管理
let fullResponseData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 2000;

// --- 画面制御 ---
function openTab(tabId) {
    $('.tab-content').removeClass('active');
    $('.tab-link').removeClass('active');
    $(`#${tabId}`).addClass('active');
    $(`button[onclick="openTab('${tabId}')"]`).addClass('active');
}

// 動的な行追加
$('#btn-add-row').on('click', function() {
    const row = `<div class="data-row">
        <input type="text" placeholder="キー" class="data-key">
        <input type="text" placeholder="値" class="data-value">
        <button class="btn-remove"><i class="fas fa-minus"></i></button>
    </div>`;
    $('#additional-data-list').append(row);
});

$(document).on('click', '.btn-remove', function() {
    $(this).parent().remove();
});

// --- UI制御: 認証入力欄の切り替え ---
$('#auth-type').on('change', function() {
    const type = $(this).val();
    let html = '';
    
    switch(type) {
        case 'bearer':
            html = '<input type="text" id="auth-token" placeholder="Bearer {token}" class="full-width">';
            break;
        case 'basic':
            html = `
                <input type="text" id="auth-u" placeholder="ユーザー名" style="width:45%">
                <input type="password" id="auth-p" placeholder="パスワード" style="width:45%">
            `;
            break;
        case 'apikey':
            html = `
                <input type="text" id="auth-key-name" placeholder="ヘッダー名 (例: X-API-KEY)" style="width:45%">
                <input type="text" id="auth-token" placeholder="キーの値" style="width:45%">
            `;
            break;
        case 'jwt':
        case 'oauth':
            html = `<input type="text" id="auth-token" placeholder="${type.toUpperCase()} トークン" class="full-width">`;
            break;
    }
    $('#auth-inputs').html(html);
});

// --- API送信処理のアップグレード ---
$('#btn-send').on('click', async function() {
    const url = $('#api-url').val();
    const method = $('#api-method').val();
    if (!url) return alert("URLを入力してください");

    $('#loading').removeClass('hidden');
    $('#error-display').addClass('hidden');
    
    // ヘッダーの準備
    let headers = {
        'Content-Type': 'application/json'
    };

    // 認証情報の付与
    const authType = $('#auth-type').val();
    if (authType === 'bearer') {
        headers['Authorization'] = $('#auth-token').val();
    } else if (authType === 'basic') {
        const u = $('#auth-u').val();
        const p = $('#auth-p').val();
        headers['Authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(u + ':' + p)));
    } else if (authType === 'apikey') {
        const keyName = $('#auth-key-name').val();
        headers[keyName] = $('#auth-token').val();
    } else if (authType === 'jwt' || authType === 'oauth') {
        headers['Authorization'] = 'Bearer ' + $('#auth-token').val();
    }

    // 追加データ（キー：値）をヘッダーまたはボディに反映させるロジック
    // ※ここでは簡易的にボディ用データとしてパースします
    let bodyData = {};
    $('.data-row').each(function() {
        const k = $(this).find('.data-key').val();
        const v = $(this).find('.data-value').val();
        if (k) bodyData[k] = v;
    });

    try {
        const options = {
            method: method,
            headers: headers
        };

        // GET/HEAD以外はボディを付与
        if (['GET', 'HEAD'].indexOf(method) === -1) {
            options.body = JSON.stringify(bodyData);
        }

        const response = await fetch(url, options);
        // ...（以下、前回のレスポンス表示処理と同じ）
        const status = response.status;
        if (status !== 200) {
            $('#error-display').text(`Error: ${status} ${response.statusText}`).removeClass('hidden');
            const text = await response.text();
            $('#raw-response').text(text);
        } else {
            const data = await response.json();
            handleSuccessResponse(data);
        }
    } catch (err) {
        $('#error-display').text(`送信エラー: ${err.message}`).removeClass('hidden');
    } finally {
        $('#loading').addClass('hidden');
    }
});

function handleSuccessResponse(data) {
    fullResponseData = Array.isArray(data) ? data : [data];
    filteredData = [...fullResponseData];
    $('#search-filter-area').removeClass('hidden');
    
    createFilterCheckboxes(fullResponseData[0]);
    renderTable();
}

// --- テーブル描画・フィルタ・検索 ---
function createFilterCheckboxes(sampleObj) {
    const container = $('#column-filters').empty().append('表示キー: ');
    Object.keys(sampleObj).forEach(key => {
        container.append(`
            <label><input type="checkbox" class="col-filter" value="${key}" checked> ${key}</label>
        `);
    });
}

function renderTable() {
    const keys = $('.col-filter:checked').map((_, el) => el.value).get();
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    let html = '<table><thead><tr>';
    keys.forEach(k => html += `<th>${k}</th>`);
    html += '</tr></thead><tbody>';

    pageData.forEach((row, rowIndex) => {
        html += `<tr data-idx="${start + rowIndex}">`;
        keys.forEach(k => {
            const val = row[k] !== undefined ? row[k] : '';
            html += `<td contenteditable="true" data-key="${k}">${val}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    $('#table-container').html(html);
    renderPagination();
    attachTableEvents();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const container = $('#pagination').empty();
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = $(`<button class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`);
        btn.on('click', () => { currentPage = i; renderTable(); });
        container.append(btn);
    }
}

// --- テーブル編集・バリデーション ---
function attachTableEvents() {
    $('td[contenteditable="true"]').on('input', function() {
        const $cell = $(this);
        const val = $cell.text().trim();
        
        // 変更検知（簡易的に元のデータと比較）
        const rowIdx = $cell.closest('tr').data('idx');
        const key = $cell.data('key');
        const originalVal = String(filteredData[rowIdx][key] || '');

        if (val === "") {
            $cell.addClass('cell-empty').removeClass('cell-changed');
        } else if (val !== originalVal) {
            $cell.addClass('cell-changed').removeClass('cell-empty');
        } else {
            $cell.removeClass('cell-changed cell-empty');
        }

        validateTable();
    });
}

function validateTable() {
    const hasError = $('.cell-empty').length > 0;
    const isChanged = $('.cell-changed').length > 0;
    $('#btn-update').prop('disabled', hasError || !isChanged);
}

// 検索処理
$('#table-search').on('input', function() {
    const term = $(this).val().toLowerCase();
    filteredData = fullResponseData.filter(row => 
        Object.values(row).some(v => String(v).toLowerCase().includes(term))
    );
    currentPage = 1;
    renderTable();
});

$(document).on('change', '.col-filter', renderTable);

// CSVダウンロード
$('#btn-csv').on('click', function() {
    if (filteredData.length === 0) return;
    const keys = Object.keys(filteredData[0]);
    let csvContent = keys.join(",") + "\n";
    filteredData.forEach(row => {
        csvContent += keys.map(k => `"${String(row[k]).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "api_response.csv";
    link.click();
});

// クリアボタン
$('#btn-clear').on('click', function() {
    $('#table-container, #raw-response, #column-filters, #pagination, #error-display').empty();
    $('#search-filter-area').addClass('hidden');
    $('#btn-update').prop('disabled', true);
});

// 変更保存（モック）
$('#btn-update').on('click', function() {
    alert("変更を保存しました（フロントエンドのメモリ内）");
    // ここで実際のPUT/PATCHリクエストを実装可能

});
