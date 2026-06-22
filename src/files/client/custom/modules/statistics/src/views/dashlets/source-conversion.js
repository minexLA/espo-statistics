define('statistics:views/dashlets/source-conversion',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/source-conversion',

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
            this.$el.find('.stat-table-body').html(
                '<tr><td colspan="4" class="text-center text-muted" style="padding:20px;"><em>Loading…</em></td></tr>'
            );
            let configSources = this.getOption('sources') || [];
            let params = Object.assign({}, store.getParams());
            if (configSources.length > 0) params.sources = JSON.stringify(configSources);

            Espo.Ajax.getRequest('Statistics/action/getSourceConversionStats', params)
                .then(response => { if (this.isRendered()) this.updateUI(response); })
                .catch(() => {
                    if (this.isRendered()) {
                        this.$el.find('.stat-table-body').html(
                            '<tr><td colspan="4" class="text-center text-danger" style="padding:16px;">Error loading data.</td></tr>'
                        );
                    }
                });
        },

        updateUI: function (data) {
            let rows = data.rows || [];
            if (rows.length === 0) {
                this.$el.find('.stat-table-body').html(
                    '<tr><td colspan="4" class="text-center text-muted" style="padding:20px;"><em>No data</em></td></tr>'
                );
                return;
            }

            let sourceMap = this.translate('source', 'options', 'Lead') || {};
            let html = rows.map(row => {
                let sourceLbl = sourceMap[row.source] || row.source || '—';
                let barW   = Math.round(row.rate);
                let barClr = row.rate >= 50 ? '#4caf50' : '#e57373';
                let txtClr = row.rate >= 50 ? '#2d8f2d' : '#a94442';
                let bgClr  = row.rate >= 50 ? '#e6f7e6' : '#f2dede';
                let bdClr  = row.rate >= 50 ? '#cceccc' : '#ebccd1';

                return `<tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:8px 10px;font-weight:500;">${this.escHtml(sourceLbl)}</td>
                    <td style="padding:8px 10px;text-align:right;color:#555;font-size:13px;">${row.total} / ${row.converted}</td>
                    <td style="padding:8px 10px;min-width:90px;">
                        <div style="background:#eee;border-radius:4px;height:7px;">
                            <div style="width:${barW}%;background:${barClr};height:7px;border-radius:4px;transition:width .3s;"></div>
                        </div>
                    </td>
                    <td style="padding:8px 10px;text-align:right;">
                        <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;
                            color:${txtClr};background:${bgClr};border:1px solid ${bdClr};">
                            ${row.rate}%
                        </span>
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
