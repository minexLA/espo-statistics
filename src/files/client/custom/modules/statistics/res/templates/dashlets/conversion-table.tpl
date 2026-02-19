<div class="dashlet-content">
    <div class="row margin-bottom-lg" style="padding: 10px 15px 0;">
        <div class="col-md-4 col-sm-4">
            <div class="form-group">
                <label class="control-label small">{{translate 'Agent' category='fields' scope='Statistics'}}</label>
                <div class="filter-container-agent"></div>
            </div>
        </div>
        <div class="col-md-4 col-sm-4">
            <div class="form-group">
                <label class="control-label small">{{translate 'Source' category='fields' scope='Statistics'}}</label>
                <div class="filter-container-partner"></div>
            </div>
        </div>
        <div class="col-md-4 col-sm-4">
            <div class="form-group">
                <label class="control-label small">{{translate 'Period' category='labels' scope="Statistics"}}</label>
                <div class="filter-container-period"></div>
            </div>
        </div>
    </div>

    <hr>

    <div class="list-container">
        <table class="table table-hover">
            <thead>
            <tr>
                <th width="70%"><b>{{translate 'Metric' scope='Statistics'}}</b></th>
                <th width="30%" align="right" style="text-align: right;"><b>{{translate 'Value' scope='Statistics'}}</b></th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>{{translate 'Total Leads' scope='Statistics'}}</td>
                <td align="right"><span class="badge" style="background: #f5f5f5; color: #333; border: 1px solid #ddd;" data-name="total-count">--</span></td>
            </tr>
            <tr>
                <td>{{translate 'Converted Leads' scope='Statistics'}}</td>
                <td align="right"><span class="badge" style="background: #f5f5f5; color: #333; border: 1px solid #ddd;" data-name="converted-count">--</span></td>
            </tr>
            <tr>
                <td>{{translate 'Conversion Rate'}}</td>
                <td align="right"><span class="badge" style="background: #e6f7e6; color: #2d8f2d; border: 1px solid #cceccc;" data-name="conversion-rate">--%</span></td>
            </tr>
            </tbody>
        </table>
    </div>

    <div class="padding" style="color: #888; font-size: 12px; border-top: 1px solid #eee;">
        <span data-name="footer-text">{{translate 'Loading...' scope="Statistics"}}</span>
    </div>
</div>
