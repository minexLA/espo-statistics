<?php

namespace Espo\Modules\Statistics\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\Core\Api\Request;

class Statistics extends Base
{
    private function getStatisticsService(): \Espo\Modules\Statistics\Services\Statistics
    {
        /** @var \Espo\Modules\Statistics\Services\Statistics */
        return $this->getService('Statistics');
    }

    public function actionGetConversionStats(Request $request): array
    {
        return $this->getStatisticsService()->getConversionStats($request->getQueryParams());
    }

    public function actionGetAvgWalletStats(Request $request): array
    {
        return $this->getStatisticsService()->getAvgWalletStats($request->getQueryParams());
    }

    public function actionGetSourceConversionStats(Request $request): array
    {
        return $this->getStatisticsService()->getSourceConversionStats($request->getQueryParams());
    }

    public function actionGetGeoConversionStats(Request $request): array
    {
        return $this->getStatisticsService()->getGeoConversionStats($request->getQueryParams());
    }

    public function actionGetAgentStats(Request $request): array
    {
        return $this->getStatisticsService()->getAgentStats($request->getQueryParams());
    }

    public function actionGetGeoCharbarStats(Request $request): array
    {
        return $this->getStatisticsService()->getGeoCharbarStats($request->getQueryParams());
    }

    public function actionGetValidCharbarStats(Request $request): array
    {
        return $this->getStatisticsService()->getValidCharbarStats($request->getQueryParams());
    }

    public function actionGetStatusCharbarStats(Request $request): array
    {
        return $this->getStatisticsService()->getStatusCharbarStats($request->getQueryParams());
    }
}
