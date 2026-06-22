<div class="dashlet-content" style="padding: 14px 12px;">

    {{!-- Source tags header --}}
    <div data-name="sources-header" style="text-align:center; margin-bottom:14px; min-height:28px;"></div>

    {{!-- 3 big stat badges --}}
    <div class="stat-badges" style="display:flex; gap:10px; justify-content:center;">

        <div style="flex:1; text-align:center; background:#f0f4ff; border:1px solid #c5d3f0;
                    border-radius:10px; padding:14px 8px;">
            <div style="font-size:32px; font-weight:700; color:#3366cc; line-height:1;" data-stat="total">–</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:.5px;">
                {{translate 'Total Leads' scope='Statistics'}}
            </div>
        </div>

        <div style="flex:1; text-align:center; background:#f0fff4; border:1px solid #b2dfdb;
                    border-radius:10px; padding:14px 8px;">
            <div style="font-size:32px; font-weight:700; color:#00796b; line-height:1;" data-stat="converted">–</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:.5px;">
                {{translate 'Converted Leads' scope='Statistics'}}
            </div>
        </div>

        <div class="rate-card" style="flex:1; text-align:center; background:#e6f7e6; border:2px solid #4caf50;
                    border-radius:10px; padding:14px 8px;">
            <div style="font-size:32px; font-weight:700; color:#2d8f2d; line-height:1;" data-stat="rate">–</div>
            <div style="font-size:10px; color:#888; margin-top:6px; text-transform:uppercase; letter-spacing:.5px;">
                {{translate 'Conversion Rate'}}
            </div>
        </div>

    </div>

    {{!-- Progress bar --}}
    <div style="margin:14px 0 4px; background:#eee; border-radius:6px; height:8px;">
        <div class="rate-bar-fill" style="width:0%; background:#4caf50; height:8px; border-radius:6px; transition:width .5s;"></div>
    </div>

</div>
