<?php

namespace App\Services;

class GpsRouteService
{
    private const MAX_ACCURACY_METERS = 100.0;

    private const MAX_JUMP_METERS = 250.0;

    private const MIN_SEGMENT_METERS = 1.0;

    /**
     * @param  array<int, array{lat: float|int, lng: float|int, accuracy: float|int, timestamp: int, altitude?: float|int|null}>  $points
     * @return array{polyline: string|null, distance_m: float, elevation_gain_m: float, point_count: int, max_accuracy_m: float|null}
     */
    public function process(array $points): array
    {
        $acceptedPoints = [];
        $previousPoint = null;
        $distanceMeters = 0.0;
        $elevationGainM = 0.0;
        $previousAltitude = null;
        $maxAccuracy = null;

        foreach ($points as $point) {
            $latitude = (float) $point['lat'];
            $longitude = (float) $point['lng'];
            $accuracy = (float) $point['accuracy'];
            $timestamp = (int) $point['timestamp'];
            $altitude = isset($point['altitude']) && is_numeric($point['altitude'])
                ? (float) $point['altitude']
                : null;

            if (
                ! is_finite($latitude)
                || ! is_finite($longitude)
                || ! is_finite($accuracy)
                || $latitude < -90
                || $latitude > 90
                || $longitude < -180
                || $longitude > 180
                || $accuracy < 0
                || $accuracy > self::MAX_ACCURACY_METERS
                || $timestamp <= 0
            ) {
                continue;
            }

            $maxAccuracy = $maxAccuracy === null ? $accuracy : max($maxAccuracy, $accuracy);
            $currentPoint = [
                'lat' => $latitude,
                'lng' => $longitude,
                'timestamp' => $timestamp,
            ];

            if ($previousPoint === null) {
                $acceptedPoints[] = $currentPoint;
                $previousPoint = $currentPoint;
                if ($altitude !== null) {
                    $previousAltitude = $altitude;
                }

                continue;
            }

            if ($timestamp <= $previousPoint['timestamp']) {
                continue;
            }

            $segmentDistance = $this->haversineDistance(
                $previousPoint['lat'],
                $previousPoint['lng'],
                $latitude,
                $longitude,
            );

            if ($segmentDistance > self::MAX_JUMP_METERS) {
                continue;
            }

            $previousPoint = $currentPoint;
            if ($segmentDistance < self::MIN_SEGMENT_METERS) {
                continue;
            }

            $distanceMeters += $segmentDistance;
            $acceptedPoints[] = $currentPoint;

            // Calculate vertical climb/elevation gain with noise threshold
            if ($altitude !== null) {
                if ($previousAltitude !== null) {
                    $gain = $altitude - $previousAltitude;
                    // Require at least 1.0m climb, filter out unrealistic single-step jumps (>150m)
                    if ($gain > 1.0 && $gain < 150.0) {
                        $elevationGainM += $gain;
                    }
                }
                $previousAltitude = $altitude;
            }
        }

        return [
            'polyline' => $acceptedPoints === [] ? null : $this->encodePolyline($acceptedPoints),
            'distance_m' => round($distanceMeters, 2),
            'elevation_gain_m' => round($elevationGainM, 1),
            'point_count' => count($acceptedPoints),
            'max_accuracy_m' => $maxAccuracy === null ? null : round($maxAccuracy, 2),
        ];
    }

    private function haversineDistance(float $latitude1, float $longitude1, float $latitude2, float $longitude2): float
    {
        $earthRadiusMeters = 6371000.0;
        $latitudeDelta = deg2rad($latitude2 - $latitude1);
        $longitudeDelta = deg2rad($longitude2 - $longitude1);
        $latitude1 = deg2rad($latitude1);
        $latitude2 = deg2rad($latitude2);

        $a = sin($latitudeDelta / 2) ** 2
            + cos($latitude1) * cos($latitude2) * sin($longitudeDelta / 2) ** 2;

        return $earthRadiusMeters * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * @param  array<int, array{lat: float, lng: float, timestamp: int}>  $points
     */
    private function encodePolyline(array $points): string
    {
        $encoded = '';
        $previousLatitude = 0;
        $previousLongitude = 0;

        foreach ($points as $point) {
            $latitude = (int) round($point['lat'] * 100000);
            $longitude = (int) round($point['lng'] * 100000);
            $encoded .= $this->encodePolylineValue($latitude - $previousLatitude);
            $encoded .= $this->encodePolylineValue($longitude - $previousLongitude);
            $previousLatitude = $latitude;
            $previousLongitude = $longitude;
        }

        return $encoded;
    }

    private function encodePolylineValue(int $value): string
    {
        $value = $value < 0 ? ~($value << 1) : $value << 1;
        $encoded = '';

        while ($value >= 0x20) {
            $encoded .= chr((($value & 0x1F) | 0x20) + 63);
            $value >>= 5;
        }

        return $encoded.chr($value + 63);
    }
}
