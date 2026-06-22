define('statistics:views/dashlets/single-source-conversion',
    ['views/dashlets/abstract/base'],
    function (Dep) {

    return Dep.extend({
        template: 'statistics:dashlets/single-source-conversion',

        setup: function () {
            let sourceOptions = this.getMetadata()
                .get('entityDefs.Lead.fields.source.options') || [];

            let sourceMap = this.translate('source', 'options', 'Lead') || {};
            let translatedOptions = {};
            sourceOptions.forEach(function (opt) {
                translatedOptions[opt] = opt ? (sourceMap[opt] || opt) : '—';
            });

            // Store for use in renderHeader
            this._sourceMap = sourceMap;
            this._sourceOptions = sourceOptions;

            if (this.optionsFields && this.optionsFields.sources) {
                this.optionsFields.sources.options            = sourceOptions.filter(o => o);
                this.optionsFields.sources.translatedOptions = translatedOptions;
            }
        },

        afterRender: function () {
            this.renderHeader();
            this.fetchStats();
        },

        /**
         * Render source tags in the header area.
         */
        renderHeader: function () {
            let sources  = this.getOption('sources') || [];
            let $header  = this.$el.find('[data-name="sources-header"]');

            if (!sources.length) {
                $header.html(
                    '<span style="color:#aaa; font-size:13px;">— Выберите источник в настройках —</span>'
                );
                return;
            }

            let colors = [
                '#c5d3f0:#3366cc',  // blue
                '#b2dfdb:#00796b',  // teal
                '#f8bbd0:#c62828',  // red
                '#ffe082:#f57f17',  // amber
                '#c8e6c9:#2e7d32',  // green
                '#e1bee7:#6a1b9a',  // purple
            ];

            let tagsHtml = sources.map((src, idx) => {
                let label    = (this._sourceMap || {})[src] || src;
                let pair     = colors[idx % colors.length].split(':');
                let bgColor  = pair[0];
                let txtColor = pair[1];
                return `<span style="display:inline-block; margin:2px 3px; padding:4px 12px;
                    background:${bgColor}33; border:1px solid ${bgColor};
                    border-radius:20px; font-size:12px; color:${txtColor}; font-weight:600;">
                    ${this.escHtml(label)}
                </span>`;
            }).join('');

            $header.html(tagsHtml);
        },

        fetchStats: function () {
            if (!this.isRendered()) return;

            let sources = this.getOption('sources') || [];

            if (!sources.length) {
                this.$el.find('.stat-badges').html(
                    '<div class="text-center text-muted" style="padding:20px; font-size:13px;">' +
                    'Выберите источник(и) в настройках <span class="glyphicon glyphicon-cog"></span></div>'
                );
                return;
            }

            this.$el.find('[data-stat]').text('…');

            let params = {
                period:  this.getOption('period') || 'all',
                sources: JSON.stringify(sources)
            };

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

            let $bar   = this.$el.find('.rate-bar-fill');
            let barClr = data.rate >= 50 ? '#4caf50' : '#ef9a9a';
            $bar.css({ width: Math.min(data.rate, 100) + '%', background: barClr });
        },

        escHtml: function (s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    });
});
