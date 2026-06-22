define('statistics:views/dashlets/options/with-source',
    ['views/dashlets/options/base'],
    function (Dep) {

    /**
     * Custom dashlet options view.
     *
     * Overrides setupBeforeFinal() — called BEFORE EditForModalRecordView is
     * created — to inject dynamic Lead.source options into 'source' (enum) and
     * 'sources' (multi-enum) fields defined in dashlet metadata options.fields.
     *
     * NOTE: Do NOT set a `translation` key on injected options unless the
     * corresponding i18n path actually exists in a language file — EspoCRM's
     * enum field will fall back to showing only the current value when it
     * can't resolve the translation, hiding the rest of the options list.
     */
    return Dep.extend({

        setupBeforeFinal: function () {
            let sourceOptions = this.getMetadata()
                .get('entityDefs.Lead.fields.source.options') || [];

            // Single enum: 'source' field  (e.g. avg-wallet, geo-conversion, agent-stats)
            if (this.fields && this.fields.source) {
                this.fields.source.options     = [''].concat(sourceOptions);
                this.fields.source.translation = 'Lead.options.source';
            }

            // Multi-enum: 'sources' field  (e.g. source-conversion)
            if (this.fields && this.fields.sources) {
                this.fields.sources.options     = sourceOptions.slice();
                this.fields.sources.translation = 'Lead.options.source';
            }

            // geo field: options are hardcoded in the dashlet metadata JSON
            // (dynamic injection via translation caused enum field to show only
            //  the current value when the translation path didn't exist)
        }
    });
});
