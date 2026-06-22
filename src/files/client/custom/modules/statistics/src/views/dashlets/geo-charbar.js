define('statistics:views/dashlets/geo-charbar',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/geo-charbar',

        setup: function () {
            let sourceOptions = this.getMetadata()
                .get('entityDefs.Lead.fields.source.options') || [];
            let sourceMap = this.translate('source', 'options', 'Lead') || {};
            let translatedOptions = {};
            sourceOptions.forEach(opt => {
                translatedOptions[opt] = opt ? (sourceMap[opt] || opt) : '—';
            });
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
            let metric = this.getOption('metric') || 'rate';
            let params = Object.assign({ metric }, store.getParams());
            if (configSources.length > 0) params.sources = JSON.stringify(configSources);

            Espo.Ajax.getRequest('Statistics/action/getGeoCharbarStats', params)
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

            let metric      = data.metric || 'rate';
            let total       = data.grandTotal || 0;
            let palette     = this.getPalette(rows.length);
            let values      = rows.map(r => Math.max(r.barValue, 0));
            let sum         = values.reduce((a, b) => a + b, 0) || 1;
            let metricLabel = metric === 'rate' ? 'Конверсия %' : metric === 'share' ? 'Доля %' : 'Лидов';

            let svgSize = 220, cx = 110, cy = 110, outerR = 90, innerR = 54;
            let segments = '', legendRows = '';

            let segments_svg = this.buildDonut(values, sum, cx, cy, outerR, innerR, palette, rows, (row, color, badge) => {
                let rateClr = row.rate >= 50 ? '#2d8f2d' : '#888';
                legendRows += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f5;">
                    <span style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
                    <span style="font-weight:600;font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escHtml(row.label)}</span>
                    <span style="font-size:12px;color:#555;white-space:nowrap;">${row.converted}/${row.total}</span>
                    <span style="font-size:12px;font-weight:600;color:${rateClr};white-space:nowrap;min-width:40px;text-align:right;">${row.rate}%</span>
                </div>`;
                return `<title>${this.escHtml(row.label)}: ${badge}</title>`;
            }, row => metric === 'rate' ? row.rate + '%' : metric === 'share' ? row.share + '%' : row.total);

            let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="display:block;margin:0 auto;">
                ${segments_svg}
                <text x="${cx}" y="${cy - 8}" text-anchor="middle" style="font-size:22px;font-weight:700;fill:#333;">${total}</text>
                <text x="${cx}" y="${cy + 16}" text-anchor="middle" style="font-size:11px;fill:#aaa;text-transform:uppercase;letter-spacing:1px;">всего</text>
            </svg>`;

            this.$el.find('.stat-chart-wrap').html(`
                <div style="display:flex;align-items:center;gap:20px;padding:12px 14px;flex-wrap:wrap;">
                    <div style="flex-shrink:0;">${svg}</div>
                    <div style="flex:1;min-width:160px;max-height:240px;overflow-y:auto;">
                        <div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">${metricLabel}</div>
                        ${legendRows}
                    </div>
                </div>
                <div style="padding:4px 14px 8px;color:#bbb;font-size:11px;text-align:right;">Всего лидов: ${total}</div>
            `);
        },

        /**
         * Build a donut SVG path string, handling all edge cases:
         *  - single row        → full solid circle (arc can't render 360°)
         *  - 50/50 two rows    → two exact half-circles collide at shared endpoints;
         *                        we offset both by ε so they never share a point
         *  - near-100% slice   → clamp to 2π - ε
         *
         * @param {number[]} values       - bar values per row
         * @param {number}   sum          - total of values
         * @param {number}   cx, cy       - center
         * @param {number}   outerR       - outer radius
         * @param {number}   innerR       - inner (hole) radius
         * @param {string[]} palette      - color array
         * @param {Object[]} rows         - data rows
         * @param {Function} titleFn      - (row, color, badge) → SVG <title> string
         * @param {Function} badgeFn      - (row) → badge label
         * @returns {string} SVG markup
         */
        buildDonut: function (values, sum, cx, cy, outerR, innerR, palette, rows, titleFn, badgeFn) {
            if (rows.length === 1) {
                // Single slice — draw solid donut circles, arc command can't handle 360°
                let color = palette[0];
                let badge = badgeFn(rows[0]);
                titleFn(rows[0], color, badge); // side-effect: fills legendRows
                return `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${color}" stroke="#fff" stroke-width="2"/>
                        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#fff"/>`;
            }

            // For 2+ slices: offset each slice start by a tiny ε gap (1px arc length)
            // so that no two path endpoints ever coincide, even at exactly 50/50
            const GAP_DEG = 1.0; // degrees of visual gap between slices
            const GAP_RAD = (GAP_DEG / 360) * Math.PI * 2;
            const totalGap = GAP_RAD * rows.length;

            let out = '';
            let angle = -Math.PI / 2;

            rows.forEach((row, i) => {
                let proportion = values[i] / sum;
                // Reserve gap from each slice; minimum visible slice = 2*gap
                let slice = Math.max(proportion * (Math.PI * 2 - totalGap), GAP_RAD * 0.1);

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

                angle += slice + GAP_RAD; // advance by slice + gap
            });

            return out;
        },

        getPalette: function (n) {
            let base = [
                '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f',
                '#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ac',
                '#54a0ff','#ff6b6b','#feca57','#48dbfb','#ff9f43',
                '#6c5ce7','#00b894','#fd79a8','#00cec9','#e17055'
            ];
            return n <= base.length
                ? base.slice(0, n)
                : Array.from({length: n}, (_, i) => base[i % base.length]);
        },

        escHtml: function (s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    });
});
