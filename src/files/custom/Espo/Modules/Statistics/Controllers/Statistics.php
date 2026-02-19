<?php

namespace Espo\Modules\Statistics\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\Core\Api\Request;

class Statistics extends Base
{
    public function actionGetConversionStats(Request $request, $response): array
    {
        $params = $request->getQueryParams();
        // Call the service in the Custom namespace
        $service = $this->getService('Statistics');

        return $service->getConversionStats($params);
    }
}
