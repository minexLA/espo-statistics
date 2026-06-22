define('statistics:views/dashlets/date-range-bar',
    ['views/dashlets/abstract/base', 'statistics:date-range-store'],
    function (Dep, store) {

    return Dep.extend({
        template: 'statistics:dashlets/date-range-bar',

        // No options fields — this dashlet is purely a controller
        optionsFields: {},

        events: {
            'click .stat-drb-preset': function (e) {
                let preset = e.currentTarget.dataset.preset;
                let { from, to } = this.resolvePreset(preset);

                this.$el.find('.stat-drb-from').val(from);
                this.$el.find('.stat-drb-to').val(to);

                this.$el.find('.stat-drb-preset').removeClass('stat-drb-active');
                e.currentTarget.classList.add('stat-drb-active');

                this.applyRange(from, to);
            },

            'click .stat-drb-apply': function () {
                let from = this.$el.find('.stat-drb-from').val();
                let to   = this.$el.find('.stat-drb-to').val();
                this.$el.find('.stat-drb-preset').removeClass('stat-drb-active');
                this.applyRange(from, to);
            },

            'click .stat-drb-clear': function () {
                this.$el.find('.stat-drb-from').val('');
                this.$el.find('.stat-drb-to').val('');
                this.$el.find('.stat-drb-preset').removeClass('stat-drb-active');
                this.$el.find('[data-preset="all"]').addClass('stat-drb-active');
                this.applyRange('', '');
            },

            'change .stat-drb-from, .stat-drb-to': function () {
                this.$el.find('.stat-drb-preset').removeClass('stat-drb-active');
            }
        },

        afterRender: function () {
            // Restore current store values into inputs
            this.$el.find('.stat-drb-from').val(store.dateFrom);
            this.$el.find('.stat-drb-to').val(store.dateTo);

            if (!store.dateFrom && !store.dateTo) {
                this.$el.find('[data-preset="all"]').addClass('stat-drb-active');
            }
        },

        applyRange: function (from, to) {
            store.set(from, to);
            this.updateSummary(from, to);
        },

        updateSummary: function (from, to) {
            let txt = '';
            if (from && to) {
                txt = `${from} — ${to}`;
            } else if (from) {
                txt = `от ${from}`;
            } else if (to) {
                txt = `до ${to}`;
            } else {
                txt = 'Всё время';
            }
            this.$el.find('.stat-drb-summary').text(txt);
        },

        resolvePreset: function (preset) {
            let now  = new Date();
            let fmt  = d => d.toISOString().slice(0, 10);
            let today = fmt(now);

            switch (preset) {
                case 'today':
                    return { from: today, to: today };

                case 'yesterday': {
                    let d = new Date(now);
                    d.setDate(d.getDate() - 1);
                    let s = fmt(d);
                    return { from: s, to: s };
                }

                case 'last7': {
                    let d = new Date(now);
                    d.setDate(d.getDate() - 6);
                    return { from: fmt(d), to: today };
                }

                case 'last30': {
                    let d = new Date(now);
                    d.setDate(d.getDate() - 29);
                    return { from: fmt(d), to: today };
                }

                case 'thisMonth': {
                    let d = new Date(now.getFullYear(), now.getMonth(), 1);
                    return { from: fmt(d), to: today };
                }

                case 'lastMonth': {
                    let first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    let last  = new Date(now.getFullYear(), now.getMonth(), 0);
                    return { from: fmt(first), to: fmt(last) };
                }

                case 'thisYear': {
                    let d = new Date(now.getFullYear(), 0, 1);
                    return { from: fmt(d), to: today };
                }

                case 'all':
                default:
                    return { from: '', to: '' };
            }
        }
    });
});
