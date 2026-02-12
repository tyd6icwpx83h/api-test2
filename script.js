:root {
    --primary: #2563eb;
    --success: #16a34a;
    --danger: #dc2626;
    --bg: #f3f4f6;
    --border: #d1d5db;
}

body { font-family: 'Helvetica Neue', Arial, sans-serif; background: var(--bg); margin: 0; padding: 15px; }
.app-container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; height: 95vh; }

/* タブ管理 */
.tab-nav { display: flex; background: #f8fafc; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.tab-btn { padding: 15px 30px; border: none; cursor: pointer; background: none; font-weight: bold; color: #64748b; }
.tab-btn.active { background: white; color: var(--primary); border-top: 3px solid var(--primary); }
.tab-content-wrapper { flex-grow: 1; overflow-y: auto; position: relative; }
.tab-panel { display: none; padding: 20px; }
.tab-panel.active { display: block; }

/* コントロール */
.sticky-controls { position: sticky; top: 0; background: white; padding-bottom: 15px; border-bottom: 1px solid #eee; margin-bottom: 15px; z-index: 100; display: flex; gap: 10px; }
.btn { border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; color: white; font-size: 14px; font-weight: 500; }
.btn:disabled { background: #e2e8f0 !important; cursor: not-allowed; color: #94a3b8; }
.btn-primary { background: var(--primary); }
.btn-secondary { background: #64748b; }
.btn-success { background: var(--success); }
.btn-danger { background: var(--danger); }
.btn-small { padding: 5px 10px; font-size: 12px; margin-top: 5px; background: #94a3b8; }

/* 設定セクション */
.config-section { border: 1px solid var(--border); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
.config-section h3 { margin-top: 0; border-bottom: 2px solid var(--bg); padding-bottom: 10px; font-size: 1.1em; }
input, select { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 10px; box-sizing: border-box; }
.readonly-input { background: #f1f5f9; color: #64748b; font-weight: bold; }
.kv-row { display: flex; gap: 5px; margin-bottom: 5px; }
.btn-remove-row { background: none; border: none; color: var(--danger); cursor: pointer; }

/* テーブルのスクロール対応 */
.scrollable-table-area { 
    max-height: 600px; 
    overflow: auto; 
    border: 1px solid var(--border);
    background: #fff;
    position: relative;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: auto; }
th, td { border: 1px solid var(--border); padding: 12px; text-align: left; min-width: 120px; }
th { background: #f8fafc; position: sticky; top: 0; z-index: 10; border-bottom: 2px solid var(--border); }
td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }

/* セルの状態色 */
.cell-changed { background-color: #eff6ff !important; color: #1d4ed8; font-weight: bold; box-shadow: inset 0 0 0 1px #2563eb; }
.cell-error { background-color: #fef2f2 !important; box-shadow: inset 0 0 0 1px var(--danger); }

/* その他 */
.loader { text-align: center; padding: 20px; color: var(--primary); font-size: 1.2em; }
.error-msg { background: #fff1f2; color: #991b1b; padding: 15px; border-left: 4px solid var(--danger); margin: 10px 0; }
.raw-json { background: #0f172a; color: #e2e8f0; padding: 15px; border-radius: 5px; overflow: auto; font-family: 'Courier New', monospace; }
.hidden { display: none; }
.mt-15 { margin-top: 15px; display: block; }
