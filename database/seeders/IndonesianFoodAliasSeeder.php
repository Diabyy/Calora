<?php

namespace Database\Seeders;

use App\Models\IndonesianFood;
use App\Models\IndonesianFoodAlias;
use Illuminate\Database\Seeder;

class IndonesianFoodAliasSeeder extends Seeder
{
    public function run(): void
    {
        $aliases = [
            'Nasi Putih' => ['nasi putih matang', 'nasi biasa'],
            'Nasi Merah' => ['beras merah matang'],
            'Nasi Kuning' => ['nasi kuning komplit'],
            'Nasi Goreng Kampung' => ['nasi goreng', 'nasi goreng jawa'],
            'Nasi Uduk' => ['nasi gurih'],
            'Nasi Liwet' => ['nasi liwet sunda', 'nasi liwet solo'],
            'Mie Ayam' => ['mi ayam'],
            'Mie Goreng Spesial' => ['mi goreng'],
            'Ayam Goreng Lengkuas' => ['ayam goreng kremes', 'ayam goreng'],
            'Ayam Gulai Padang' => ['gulai ayam', 'ayam gulai'],
            'Ayam Pop' => ['ayam pop padang'],
            'Opor Ayam' => ['opor'],
            'Rendang Sapi' => ['rendang'],
            'Dendeng Balado Batokok' => ['dendeng balado'],
            'Pepes Ikan' => ['pepes ikan mas', 'pepes'],
            'Ikan Goreng' => ['ikan goreng sederhana'],
            'Tahu Goreng' => ['tahu goreng biasa'],
            'Tahu Bacem' => ['tahu bacem jawa'],
            'Tempe Goreng' => ['tempe goreng biasa'],
            'Udang Balado' => ['udang balado merah'],
            'Telur Ayam Rebus' => ['telur rebus'],
            'Telur Balado' => ['telur sambal balado'],
            'Soto Ayam Lamongan / Bening (1 Mangkok)' => ['soto ayam', 'soto bening'],
            'Rawon Daging' => ['rawon sapi'],
            'Bakso Sapi Kuah (1 Porsi Komplit)' => ['bakso sapi', 'bakso kuah'],
            'Sate Ayam (Daging Saja)' => ['sate ayam'],
            'Gulai Tunjang / Kikil Padang' => ['gulai kikil', 'tunjang padang', 'kikil padang'],
            'Daun Singkong Rebus Padang' => ['daun singkong', 'pucuk ubi'],
            'Gulai Cubadak (Nangka Muda Padang)' => ['gulai nangka', 'sayur nangka'],
            'Sambal Ijo Padang (Lado Mudo)' => ['sambal ijo', 'sambal hijau', 'lado mudo'],
            'Sayur Lodeh' => ['lodeh'],
            'Urap Sayur' => ['urap'],
            'Pecel Sayur' => ['pecel'],
            'Gado-Gado Komplit' => ['gado gado'],
            'Sop Ayam Sayur' => ['sop ayam', 'sup ayam'],
            'Sayur Asem' => ['sayur asem jawa', 'sayur asam'],
            'Tumis Kangkung Terasi' => ['tumis kangkung', 'kangkung tumis'],
            'Martabak Manis' => ['terang bulan', 'martabak terang bulan'],
            'Risoles' => ['risol'],
            'Lumpia Goreng' => ['lumpia'],
            'Es Teh Manis' => ['es teh'],
            'Es Jeruk Manis' => ['es jeruk', 'jeruk dingin'],
            'Kopi Hitam Polos (Tanpa Gula)' => ['kopi hitam', 'kopi tubruk tanpa gula'],
            'Es Kopi Susu Gula Aren' => ['kopi susu gula aren', 'es kopi susu'],
        ];

        foreach ($aliases as $foodName => $foodAliases) {
            $food = IndonesianFood::query()->where('name', $foodName)->first();
            if (! $food) {
                continue;
            }

            foreach ($foodAliases as $alias) {
                IndonesianFoodAlias::updateOrCreate(
                    [
                        'indonesian_food_id' => $food->id,
                        'normalized_alias' => $this->normalize($alias),
                    ],
                    ['alias' => $alias],
                );
            }
        }
    }

    protected function normalize(string $value): string
    {
        $normalized = mb_strtolower($value);
        $normalized = preg_replace('/[^a-z0-9]+/', ' ', $normalized) ?? '';

        return trim($normalized);
    }
}
