<div class="dashlet-content">

    {{!-- Sort buttons row --}}
    <div style="display:flex;gap:6px;padding:8px 12px 4px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:11px;color:#aaa;align-self:center;margin-right:4px;">Sort:</span>
        <button class="btn btn-xs btn-default sort-active" data-sort="total"
                style="font-size:11px;padding:2px 8px;">
            {{translate 'Total Leads' scope='Statistics'}}
        </button>
        <button class="btn btn-xs btn-default" data-sort="rate"
                style="font-size:11px;padding:2px 8px;">
            {{translate 'Rate' scope='Statistics'}}
        </button>
        <button class="btn btn-xs btn-default" data-sort="geo"
                style="font-size:11px;padding:2px 8px;">
            {{translate 'GEO' scope='Statistics'}}
        </button>
    </div>

    {{!-- Geo list (rendered by JS) --}}
    <div class="stat-list" style="max-height:380px;overflow-y:auto;"></div>

    <div style="margin-top:4px;color:#bbb;font-size:11px;text-align:right;padding:2px 12px 6px;">
        <span data-name="footer-text"></span>
    </div>
</div>
