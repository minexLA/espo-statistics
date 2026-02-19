define('statistics:views/dashlets/conversion-table',
    ['views/dashlets/abstract/base', 'model'],
    function (Dep, Model) {

    return Dep.extend({
        template: 'statistics:dashlets/conversion-table',

        setup: function () {
            // 1. Initialize State
            this.filterState = {
                agentId: null,
                source: null,
                period: 'last30Days'
            };

            // 2. Initialize Model
            this.filterModel = new Model();
            this.filterModel.set({
                'period': 'last30Days',
                'agentId': null,
                'agentName': null,
                'partnerId': null,
                'partnerName': null
            });

            this.periodOptions = ['today', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'];
            this.sourceOptions = this.getMetadata().get('entityDefs.Lead.fields.source.options') || [];

            this.listenTo(this.filterModel, 'change', () => {
                this.filterState.agentId = this.filterModel.get('agentId');
                this.filterState.source = this.filterModel.get('source');
                this.filterState.period = this.filterModel.get('period');
                this.fetchStats();
            });
        },

        afterRender: function () {
            this.buildFilters();

            this.fetchStats();
        },

        buildFilters() {
            // -- Agent Filter --'
            this.createView('agentFilter', 'views/fields/link', {
                el: '.filter-container-agent',
                model: this.filterModel,
                defs: { name: 'agent', params: { entity: 'User' } },
                mode: 'edit'
            })
                .then(view => view.render()); // Force render immediately

            // -- Partner Filter --
            this.createView('sourceFilter', 'views/fields/enum', {
                el: '.filter-container-partner',
                model: this.filterModel,
                defs: {
                    name: 'source', // The field name in the model
                    params: {
                        options: this.sourceOptions,        // The list (Google, Facebook, etc.)
                        translation: 'Lead.options.source', // Helper to translate keys
                        allowEmpty: true,                   // Adds "All" option
                        emptyText: this.translate('All')
                    }
                },
                mode: 'edit'
            })
                .then(view => view.render());

            // -- Period Filter --
            this.createView('periodFilter', 'views/fields/enum', {
                el: '.filter-container-period',
                model: this.filterModel,
                defs: {
                    name: 'period',
                    params: {
                        options: this.periodOptions,
                        translation: 'Global.options.dateFilter'
                    }
                },
                mode: 'edit'
            })
                .then(view => view.render());
        },

        fetchStats: function () {
            if (!this.isRendered()) return;

            this.$el.find('[data-name="total-count"]').text('...');
            this.$el.find('[data-name="converted-count"]').text('...');
            this.$el.find('[data-name="conversion-rate"]').text('...');

            this.$el.find('[data-name="footer-text"]').text("Loading...");

            Espo.Ajax.getRequest('Statistics/action/getConversionStats', this.filterState)
                .then(response => {
                    if (this.isRendered()) {
                        this.updateUI(response);
                    }
                })
                .catch(error => {
                    console.error("Statistics Error:", error);
                    if (this.isRendered()) {
                        this.$el.find('[data-name="footer-text"]').text("Error loading data.");
                    }
                });
        },

        updateUI: function (data) {
            this.$el.find('[data-name="total-count"]').text(data.total);
            this.$el.find('[data-name="converted-count"]').text(data.converted);

            let color = '#2d8f2d';
            let bg = '#e6f7e6';
            if (data.rate < 50) { color = '#a94442'; bg = '#f2dede'; }

            let $badge = this.$el.find('[data-name="conversion-rate"]');
            $badge.text(data.rate + '%');
            $badge.css({'color': color, 'background-color': bg, 'border-color': color});

            this.$el.find('[data-name="footer-text"]').text("Last updated: " + new Date().toLocaleTimeString());
        }
    });
});
