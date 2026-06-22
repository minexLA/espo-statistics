<div class="dashlet-content" style="padding:14px 12px;">

    <div style="display:flex;flex-wrap:wrap;gap:10px;">

        {{!-- Total Leads --}}
        <div style="flex:1;min-width:110px;text-align:center;
                    background:#f0f4ff;border:1px solid #c5d3f0;border-radius:10px;padding:16px 10px;">
            <div style="font-size:30px;font-weight:700;color:#3366cc;line-height:1.1;" data-stat="totalLeads">–</div>
            <div style="font-size:10px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:.6px;">
                {{translate 'Total Leads' scope='Statistics'}}
            </div>
        </div>

        {{!-- Leads with Deposit --}}
        <div style="flex:1;min-width:110px;text-align:center;
                    background:#f0fff4;border:1px solid #b2dfdb;border-radius:10px;padding:16px 10px;">
            <div style="font-size:30px;font-weight:700;color:#00796b;line-height:1.1;" data-stat="leadsWithAmount">–</div>
            <div style="font-size:10px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:.6px;">
                {{translate 'Leads with Amount' scope='Statistics'}}
            </div>
        </div>

        {{!-- Total Amount --}}
        <div style="flex:1;min-width:110px;text-align:center;
                    background:#fffde7;border:1px solid #ffe082;border-radius:10px;padding:16px 10px;">
            <div style="font-size:24px;font-weight:700;color:#f57f17;line-height:1.1;" data-stat="totalAmount">–</div>
            <div style="font-size:10px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:.6px;">
                {{translate 'Total Amount' scope='Statistics'}}
            </div>
        </div>

        {{!-- Avg Amount (highlighted) --}}
        <div class="stat-card-avg" style="flex:1;min-width:110px;text-align:center;
                    background:#f1fbf1;border:2px solid #4caf50;border-radius:10px;padding:16px 10px;">
            <div class="stat-card-value" style="font-size:30px;font-weight:700;color:#2d8f2d;line-height:1.1;" data-stat="avgAmount">–</div>
            <div style="font-size:10px;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:.6px;">
                {{translate 'Avg Amount' scope='Statistics'}}
            </div>
        </div>

    </div>

    <div style="margin-top:10px;color:#bbb;font-size:11px;text-align:right;">
        <span data-name="footer-text"></span>
    </div>
</div>
