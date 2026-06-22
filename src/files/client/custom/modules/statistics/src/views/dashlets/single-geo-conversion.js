define('statistics:views/dashlets/single-geo-conversion',
    ['views/dashlets/abstract/base'],
    function (Dep) {

    return Dep.extend({
        template: 'statistics:dashlets/single-geo-conversion',

        setup: function () {
            let sourceOptions = this.getMetadata()
                .get('entityDefs.Lead.fields.source.options') || [];

            let sourceMap = this.translate('source', 'options', 'Lead') || {};
            let translatedOptions = {};
            sourceOptions.forEach(function (opt) {
                translatedOptions[opt] = opt ? (sourceMap[opt] || opt) : '—';
            });

            if (this.optionsFields && this.optionsFields.sources) {
                this.optionsFields.sources.options            = sourceOptions.filter(o => o);
                this.optionsFields.sources.translatedOptions = translatedOptions;
            }
        },

        afterRender: function () {
            let geo = this.getOption('geo') || '';
            this.$el.find('[data-name="geo-label"]').text(geo || '—');
            this.fetchStats();
        },

        fetchStats: function () {
            if (!this.isRendered()) return;

            let geo = this.getOption('geo') || '';

            if (!geo) {
                this.$el.find('.stat-badges').html(
                    '<div class="text-center text-muted" style="padding:20px; font-size:13px;">' +
                    'Set GEO in dashlet options <span class="glyphicon glyphicon-cog"></span></div>'
                );
                return;
            }

            this.$el.find('[data-stat]').text('…');

            let configSources = this.getOption('sources') || [];
            let params = {
                period: this.getOption('period') || 'all',
                geo:    geo
            };
            if (configSources.length > 0) {
                params.sources = JSON.stringify(configSources);
            }

            Espo.Ajax.getRequest('Statistics/action/getConversionStats', params)
                .then(response => {
                    if (this.isRendered()) this.updateUI(response);
                })
                .catch(() => {
                    if (this.isRendered()) {
                        this.$el.find('[data-stat]').text('—');
                    }
                });
        },

        updateUI: function (data) {
            this.$el.find('[data-stat="total"]').text(data.total);
            this.$el.find('[data-stat="converted"]').text(data.converted);
            this.$el.find('[data-stat="rate"]').text(data.rate + '%');

            let $rateCard = this.$el.find('.rate-card');
            let $rateVal  = this.$el.find('[data-stat="rate"]');

            if (data.rate >= 50) {
                $rateCard.css({ background: '#e6f7e6', 'border-color': '#4caf50' });
                $rateVal.css('color', '#2d8f2d');
            } else if (data.rate > 0) {
                $rateCard.css({ background: '#f2dede', 'border-color': '#e57373' });
                $rateVal.css('color', '#a94442');
            } else {
                $rateCard.css({ background: '#fafafa', 'border-color': '#ddd' });
                $rateVal.css('color', '#aaa');
            }

            let $bar = this.$el.find('.rate-bar-fill');
            let barClr = data.rate >= 50 ? '#4caf50' : '#ef9a9a';
            $bar.css({ width: Math.min(data.rate, 100) + '%', background: barClr });
        }
    });
});
