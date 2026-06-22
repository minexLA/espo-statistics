/**
 * statistics:date-range-store
 *
 * AMD singleton that holds the active date range and notifies all
 * subscribed dashlets whenever the range changes.
 *
 * Usage:
 *   require(['statistics:date-range-store'], function (store) {
 *       store.on(function (dateFrom, dateTo) { ... });
 *   });
 */
define('statistics:date-range-store', [], function () {

    // Re-use the same object across multiple require() calls
    if (!window.__statDateRangeStore) {
        window.__statDateRangeStore = {
            dateFrom: '',
            dateTo:   '',
            _listeners: [],

            /** Subscribe. Returns an unsubscribe function. */
            on: function (cb) {
                this._listeners.push(cb);
                return () => this.off(cb);
            },

            /** Unsubscribe. */
            off: function (cb) {
                this._listeners = this._listeners.filter(f => f !== cb);
            },

            /** Update the range and notify all listeners. */
            set: function (dateFrom, dateTo) {
                this.dateFrom = dateFrom || '';
                this.dateTo   = dateTo   || '';
                this._listeners.slice().forEach(function (cb) {
                    try { cb(dateFrom, dateTo); } catch (e) { /* swallow */ }
                });
            },

            /** Convenience: returns {dateFrom, dateTo} for use in Ajax params. */
            getParams: function () {
                return { dateFrom: this.dateFrom, dateTo: this.dateTo };
            }
        };
    }

    return window.__statDateRangeStore;
});
