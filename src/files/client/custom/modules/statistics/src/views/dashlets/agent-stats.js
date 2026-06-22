define('statistics:views/dashlets/agent-stats',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/agent-stats',

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

        sortKey: 'rate',
        sortDir: 'desc',

        events: {
            'click [data-sort]': function (e) {
                let key = e.currentTarget.dataset.sort;
                if (this.sortKey === key) {
                    this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
                } else {
                    this.sortKey = key;
                    this.sortDir = 'desc';
                }
                if (this.lastRows) this.renderRows(this.lastRows);
            }
        },

        afterRender: function () { this.fetchStats(); },

        fetchStats: function () {
            if (!this.isRendered()) return;
            this.$el.find('.stat-table-body').html(
                '<tr><td colspan="8" class="text-center text-muted" style="padding:20px;"><em>Loading…</em></td></tr>'
            );
            let configSources = this.getOption('sources') || [];
            let params = Object.assign({}, store.getParams());
            if (configSources.length > 0) params.sources = JSON.stringify(configSources);

            Espo.Ajax.getRequest('Statistics/action/getAgentStats', params)
                .then(response => {
                    if (this.isRendered()) {
                        this.lastRows = response.rows || [];
                        this.renderRows(this.lastRows);
                    }
                })
                .catch(() => {
                    if (this.isRendered()) {
                        this.$el.find('.stat-table-body').html(
                            '<tr><td colspan="8" class="text-center text-danger" style="padding:16px;">Error loading data.</td></tr>'
                        );
                    }
                });
        },

        renderRows: function (rows) {
            if (!rows || rows.length === 0) {
                this.$el.find('.stat-table-body').html(
                    '<tr><td colspan="8" class="text-center text-muted" style="padding:20px;"><em>No data</em></td></tr>'
                );
                return;
            }

            let sorted = rows.slice().sort((a, b) => {
                let va = a[this.sortKey], vb = b[this.sortKey];
                if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
                if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
                if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
                return 0;
            });

            let html = sorted.map((row, idx) => {
                let rateClr = row.rate >= 50 ? '#2d8f2d' : '#a94442';
                let rateBg  = row.rate >= 50 ? '#e6f7e6' : '#f2dede';
                let rateBd  = row.rate >= 50 ? '#cceccc' : '#ebccd1';
                let barClr  = row.rate >= 50 ? '#4caf50' : '#ef9a9a';
                let barW    = Math.min(Math.round(row.rate), 100);
                let rvClr   = row.rateValid >= 50 ? '#2d8f2d' : '#a94442';
                let rvBg    = row.rateValid >= 50 ? '#e6f7e6' : '#f2dede';
                let rvBd    = row.rateValid >= 50 ? '#cceccc' : '#ebccd1';
                let fmt = v => parseFloat(v || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

                return `<tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:7px 10px;">
                        <span style="color:#ccc;font-size:11px;margin-right:5px;">${idx + 1}</span>
                        <strong>${this.escHtml(row.agentName || '—')}</strong>
                    </td>
                    <td style="padding:7px 10px;text-align:right;font-size:13px;color:#555;">${row.total}</td>
                    <td style="padding:7px 10px;text-align:right;font-size:13px;color:#555;">${row.converted}</td>
                    <td style="padding:7px 10px;min-width:110px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="flex:1;background:#eee;border-radius:4px;height:6px;">
                                <div style="width:${barW}%;background:${barClr};height:6px;border-radius:4px;transition:width .3s;"></div>
                            </div>
                            <span style="display:inline-block;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600;
                                color:${rateClr};background:${rateBg};border:1px solid ${rateBd};white-space:nowrap;">
                                ${row.rate}%
                            </span>
                        </div>
                    </td>
                    <td style="padding:7px 10px;text-align:center;">
                        <span style="display:inline-block;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600;
                            color:${rvClr};background:${rvBg};border:1px solid ${rvBd};white-space:nowrap;">
                            ${row.rateValid}%
                        </span>
                        <div style="font-size:10px;color:#aaa;margin-top:2px;">${row.convValid}/${row.validTotal}</div>
                    </td>
                    <td style="padding:7px 10px;text-align:right;">
                        <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;
                            color:#3366cc;background:#f0f4ff;border:1px solid #c5d3f0;">
                            $${fmt(row.avgCheck)}
                        </span>
                    </td>
                    <td style="padding:7px 10px;text-align:right;">
                        <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;
                            color:#6a1b9a;background:#f3e5f5;border:1px solid #ce93d8;">
                            $${fmt(row.avgPerClient)}
                        </span>
                    </td>
                    <td style="padding:7px 10px;text-align:right;font-size:12px;color:#888;">
                        $${fmt(row.totalAmount)}
                    </td>
                </tr>`;
            }).join('');

            this.$el.find('.stat-table-body').html(html);
        },

        escHtml: function (s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    });
});
