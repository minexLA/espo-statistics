define('statistics:views/dashlets/geo-conversion',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/geo-conversion',

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

        sortKey: 'total',
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
                this.$el.find('[data-sort]').removeClass('sort-active');
                e.currentTarget.classList.add('sort-active');
                if (this.lastRows) this.renderRows(this.lastRows);
            }
        },

        afterRender: function () { this.fetchStats(); },

        fetchStats: function () {
            if (!this.isRendered()) return;
            this.$el.find('.stat-list').html(
                '<div class="text-center text-muted" style="padding:20px;"><em>Loading…</em></div>'
            );
            let configSources = this.getOption('sources') || [];
            let params = Object.assign({}, store.getParams());
            if (configSources.length > 0) params.sources = JSON.stringify(configSources);

            Espo.Ajax.getRequest('Statistics/action/getGeoConversionStats', params)
                .then(response => {
                    if (this.isRendered()) {
                        this.lastRows = response.rows || [];
                        this.renderRows(this.lastRows);
                    }
                })
                .catch(() => {
                    if (this.isRendered()) {
                        this.$el.find('.stat-list').html(
                            '<div class="text-center text-danger" style="padding:16px;">Error loading data.</div>'
                        );
                    }
                });
        },

        renderRows: function (rows) {
            if (!rows || rows.length === 0) {
                this.$el.find('.stat-list').html(
                    '<div class="text-center text-muted" style="padding:20px;"><em>No data</em></div>'
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
                let barW   = Math.round(row.rate);
                let barClr = row.rate >= 50 ? '#4caf50' : '#ef9a9a';
                let txtClr = row.rate >= 50 ? '#2d8f2d' : '#a94442';
                let bgClr  = row.rate >= 50 ? '#e6f7e6' : '#f2dede';
                let bdClr  = row.rate >= 50 ? '#cceccc' : '#ebccd1';
                let geo    = this.escHtml(row.geo || '—');

                return `<div style="display:flex;align-items:center;padding:7px 12px;border-bottom:1px solid #f2f2f2;gap:8px;">
                    <span style="min-width:20px;color:#bbb;font-size:11px;text-align:right;">${idx + 1}</span>
                    <span style="min-width:50px;font-weight:600;font-size:13px;">${geo}</span>
                    <div style="flex:1;background:#eee;border-radius:4px;height:7px;">
                        <div style="width:${barW}%;background:${barClr};height:7px;border-radius:4px;transition:width .3s;"></div>
                    </div>
                    <span style="display:inline-block;padding:2px 7px;border-radius:10px;font-size:12px;font-weight:600;
                        color:${txtClr};background:${bgClr};border:1px solid ${bdClr};min-width:46px;text-align:center;">
                        ${row.rate}%
                    </span>
                    <span style="color:#888;font-size:12px;min-width:55px;text-align:right;">${row.converted}/${row.total}</span>
                </div>`;
            }).join('');

            this.$el.find('.stat-list').html(html);
        },

        escHtml: function (s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    });
});
