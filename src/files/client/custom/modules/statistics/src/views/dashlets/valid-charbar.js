define('statistics:views/dashlets/valid-charbar',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/valid-charbar',

        setup: function () {
            let sourceOptions = this.getMetadata().get('entityDefs.Lead.fields.source.options') || [];
            let sourceMap = this.translate('source', 'options', 'Lead') || {};
            let translatedOptions = {};
            sourceOptions.forEach(opt => { translatedOptions[opt] = opt ? (sourceMap[opt] || opt) : '—'; });
            if (this.optionsFields && this.optionsFields.sources) {
                this.optionsFields.sources.options            = sourceOptions.filter(o => o);
                this.optionsFields.sources.translatedOptions = translatedOptions;
            }

            this._storeHandler = () => { if (this.isRendered()) this.fetchStats(); };
            store.on(this._storeHandler);
            this.on('remove', () => store.off(this._storeHandler));
        },

        afterRender: function () { this.fetchStats(); },

        fetchStats: function () {
            if (!this.isRendered()) return;
            this.$el.find('.stat-chart-wrap').html(
                '<div class="text-center text-muted" style="padding:30px;"><em>Loading…</em></div>'
            );
            let configSources = this.getOption('sources') || [];
            let metric = this.getOption('metric') || 'count';
            let params = Object.assign({ metric }, store.getParams());
            if (configSources.length > 0) params.sources = JSON.stringify(configSources);

            Espo.Ajax.getRequest('Statistics/action/getValidCharbarStats', params)
                .then(response => { if (this.isRendered()) this.renderChart(response); })
                .catch(() => {
                    if (this.isRendered()) {
                        this.$el.find('.stat-chart-wrap').html(
                            '<div class="text-center text-danger" style="padding:20px;">Error loading data.</div>'
                        );
                    }
                });
        },

        renderChart: function (data) {
            let rows = data.rows || [];
            if (!rows.length) {
                this.$el.find('.stat-chart-wrap').html(
                    '<div class="text-center text-muted" style="padding:30px;"><em>No data</em></div>'
                );
                return;
            }

            let metric     = data.metric || 'count';
            let total      = data.grandTotal || 0;
            let colorValid = '#4caf50';
            let colorOther = ['#90a4ae','#78909c','#546e7a','#455a64','#37474f'];
            let otherIdx   = 0;

            let palette = rows.map(r => r.isValid ? colorValid : colorOther[otherIdx++ % colorOther.length]);
            let values  = rows.map(r => Math.max(r.barValue, 0));
            let sum     = values.reduce((a, b) => a + b, 0) || 1;

            let validRow = rows.find(r => r.isValid);
            let validPct = validRow ? validRow.share + '%' : '—';
            let legendRows = '';

            let svgSegments = this.buildDonut(
                values, sum, 110, 110, 90, 54, palette, rows,
                (row, color, badge) => {
                    let icon = row.isValid ? ' <span style="color:#4caf50;">✓</span>' : '';
                    legendRows += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f5;">
                        <span style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
                        <span style="font-weight:600;font-size:13px;flex:1;">${this.escHtml(row.label)}${icon}</span>
                        <span style="font-size:12px;font-weight:600;color:#555;white-space:nowrap;">${badge}</span>
                        <span style="font-size:11px;color:#aaa;white-space:nowrap;min-width:36px;text-align:right;">${row.share}%</span>
                    </div>`;
                    return `<title>${this.escHtml(row.label)}: ${badge} (${row.share}%)</title>`;
                },
                row => metric === 'share' ? row.share + '%' : row.count
            );

            let svg = `<svg width="220" height="220" viewBox="0 0 220 220" style="display:block;margin:0 auto;">
                ${svgSegments}
                <text x="110" y="102" text-anchor="middle" style="font-size:22px;font-weight:700;fill:#2d8f2d;">${validPct}</text>
                <text x="110" y="126" text-anchor="middle" style="font-size:11px;fill:#aaa;text-transform:uppercase;letter-spacing:1px;">full</text>
            </svg>`;

            this.$el.find('.stat-chart-wrap').html(`
                <div style="display:flex;align-items:center;gap:20px;padding:12px 14px;flex-wrap:wrap;">
                    <div style="flex-shrink:0;">${svg}</div>
                    <div style="flex:1;min-width:160px;max-height:240px;overflow-y:auto;">
                        <div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">Валидность (c_ccval)</div>
                        ${legendRows}
                    </div>
                </div>
                <div style="padding:4px 14px 8px;color:#bbb;font-size:11px;text-align:right;">Всего лидов: ${total}</div>
            `);
        },

        buildDonut: function (values, sum, cx, cy, outerR, innerR, palette, rows, titleFn, badgeFn) {
            if (rows.length === 1) {
                let color = palette[0];
                let badge = badgeFn(rows[0]);
                titleFn(rows[0], color, badge);
                return `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${color}" stroke="#fff" stroke-width="2"/>
                        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#fff"/>`;
            }

            const GAP_RAD = ((1.0 / 360) * Math.PI * 2);
            const totalGap = GAP_RAD * rows.length;
            let out = '', angle = -Math.PI / 2;

            rows.forEach((row, i) => {
                let slice = Math.max((values[i] / sum) * (Math.PI * 2 - totalGap), GAP_RAD * 0.1);
                let color = palette[i % palette.length];
                let badge = badgeFn(row);
                let title = titleFn(row, color, badge);
                let large = slice > Math.PI ? 1 : 0;

                let x1  = cx + outerR * Math.cos(angle),         y1  = cy + outerR * Math.sin(angle);
                let x2  = cx + outerR * Math.cos(angle + slice), y2  = cy + outerR * Math.sin(angle + slice);
                let xi1 = cx + innerR * Math.cos(angle + slice), yi1 = cy + innerR * Math.sin(angle + slice);
                let xi2 = cx + innerR * Math.cos(angle),         yi2 = cy + innerR * Math.sin(angle);

                out += `<path d="M ${x1} ${y1}
                    A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}
                    L ${xi1} ${yi1}
                    A ${innerR} ${innerR} 0 ${large} 0 ${xi2} ${yi2} Z"
                    fill="${color}" stroke="#fff" stroke-width="2" style="cursor:pointer;">${title}</path>`;

                angle += slice + GAP_RAD;
            });
            return out;
        },

        escHtml: function (s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    });
});
