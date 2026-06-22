<div class="dashlet-content stat-drb-root" style="padding:10px 14px 12px;">

    {{!-- Preset buttons — wrap to fill full width --}}
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;width:100%;">
        <button class="stat-drb-preset stat-drb-active" data-preset="all">Всё время</button>
        <button class="stat-drb-preset" data-preset="today">Сегодня</button>
        <button class="stat-drb-preset" data-preset="yesterday">Вчера</button>
        <button class="stat-drb-preset" data-preset="last7">7 дней</button>
        <button class="stat-drb-preset" data-preset="last30">30 дней</button>
        <button class="stat-drb-preset" data-preset="thisMonth">Этот месяц</button>
        <button class="stat-drb-preset" data-preset="lastMonth">Прошлый месяц</button>
        <button class="stat-drb-preset" data-preset="thisYear">Этот год</button>
    </div>

    {{!-- Custom range row — full width, stretches --}}
    <div style="display:flex;align-items:center;gap:6px;width:100%;flex-wrap:nowrap;">
        <span style="font-size:11px;color:#aaa;white-space:nowrap;">От</span>
        <input type="date" class="stat-drb-from"
               style="flex:1;min-width:0;font-size:12px;padding:5px 8px;border:1px solid #ddd;
                      border-radius:6px;outline:none;color:#444;background:#fff;" />
        <span style="font-size:11px;color:#bbb;flex-shrink:0;">—</span>
        <input type="date" class="stat-drb-to"
               style="flex:1;min-width:0;font-size:12px;padding:5px 8px;border:1px solid #ddd;
                      border-radius:6px;outline:none;color:#444;background:#fff;" />
        <button class="btn btn-xs btn-primary stat-drb-apply"
                style="flex-shrink:0;font-size:11px;padding:5px 14px;border-radius:6px;white-space:nowrap;">
            Применить
        </button>
        <button class="btn btn-xs btn-default stat-drb-clear"
                style="flex-shrink:0;font-size:11px;padding:5px 9px;border-radius:6px;color:#999;">
            ✕
        </button>
    </div>

    {{!-- Active range summary --}}
    <div style="margin-top:8px;font-size:11px;color:#3366cc;">
        <span style="color:#bbb;">Период:</span>
        <span class="stat-drb-summary" style="margin-left:5px;font-weight:500;">Всё время</span>
    </div>

</div>

<style>
/* ---- Date Range Bar: preset buttons ---- */
.stat-drb-preset {
    display: inline-block;
    padding: 3px 11px;
    border-radius: 12px;
    border: 1px solid #d0d0d0;
    background: #f8f8f8;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
    line-height: 1.6;
}
.stat-drb-preset:hover:not(.stat-drb-active) {
    background: #eef2ff;
    border-color: #aab8e0;
    color: #3366cc;
}
.stat-drb-preset.stat-drb-active {
    background: #3366cc;
    color: #fff;
    border-color: #2255bb;
    font-weight: 600;
}
/* ---- Full-width responsive inputs ---- */
.stat-drb-root .stat-drb-from:focus,
.stat-drb-root .stat-drb-to:focus {
    border-color: #3366cc;
    box-shadow: 0 0 0 2px rgba(51,102,204,.15);
}
</style>
