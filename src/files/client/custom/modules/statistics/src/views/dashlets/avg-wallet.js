define('statistics:views/dashlets/avg-wallet',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/avg-wallet',

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
            this.$el.find('[data-stat]').text('…');

            let configSources = this.getOption('sources') || [];
            let params = Object.assign({}, store.getParams());
            if (configSources.length > 0) params.sources = JSON.stringify(configSources);

            Espo.Ajax.getRequest('Statistics/action/getAvgWalletStats', params)
                .then(response => { if (this.isRendered()) this.updateUI(response); })
                .catch(() => { if (this.isRendered()) this.$el.find('[data-stat]').text('—'); });
        },

        updateUI: function (data) {
            this.$el.find('[data-stat="totalLeads"]').text(data.totalLeads);
            this.$el.find('[data-stat="leadsWithAmount"]').text(data.leadsWithAmount);
            this.$el.find('[data-stat="totalAmount"]').text(this.fmt(data.totalAmount));

            let $avgVal  = this.$el.find('[data-stat="avgAmount"]');
            let $avgCard = this.$el.find('.stat-card-avg');
            $avgVal.text(this.fmt(data.avgAmount));

            if (data.avgAmount > 0) {
                $avgCard.css({ 'border-color': '#4caf50', background: '#f1fbf1' });
                $avgVal.css('color', '#2d8f2d');
            } else {
                $avgCard.css({ 'border-color': '#ddd', background: '#fafafa' });
                $avgVal.css('color', '#aaa');
            }
        },

        fmt: function (num) {
            if (num === null || num === undefined || num === '') return '—';
            return parseFloat(num).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
    });
});
