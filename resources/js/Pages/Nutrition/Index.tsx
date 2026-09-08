import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Camera, 
    Plus, 
    Search, 
    Barcode,
    Trash2, 
    Utensils, 
    Calendar, 
    Flame, 
    Sparkles, 
    Check, 
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    SlidersHorizontal,
    Edit3,
    Sunrise,
    Sun,
    Moon,
    Coffee
} from 'lucide-react';
import { visualAssets } from '@/data/visualAssets';

interface FoodItem {
    id?: number;
    name: string;
    portion_g: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    source?: string;
    indonesian_food_id?: number | null;
    [key: string]: any;
}

interface FoodLog {
    id: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    notes?: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    items: FoodItem[];
}

interface Props {
    date: string;
    logs: FoodLog[];
    consumed: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    target: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export default function NutritionIndex({ date, logs, consumed, target }: Props) {
    const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
    const [showAiModal, setShowAiModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);

    // Barcode state
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeProduct, setBarcodeProduct] = useState<any | null>(null);
    const [barcodePortion, setBarcodePortion] = useState<number>(100);
    const [barcodeLoading, setBarcodeLoading] = useState(false);
    const [barcodeError, setBarcodeError] = useState<string | null>(null);

    // AI Scanner state
    const [scanning, setScanning] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiDishName, setAiDishName] = useState('');
    const [aiItems, setAiItems] = useState<FoodItem[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Manual / Database Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedDbFood, setSelectedDbFood] = useState<any | null>(null);
    const [dbPortion, setDbPortion] = useState<number>(100);

    // Meal names mapping with professional Lucide icons
    const mealTitles: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; time: string }> = {
        breakfast: { label: 'Sarapan', icon: Sunrise, time: '06:00 - 10:00' },
        lunch: { label: 'Makan Siang', icon: Sun, time: '11:30 - 14:30' },
        dinner: { label: 'Makan Malam', icon: Moon, time: '18:00 - 21:00' },
        snack: { label: 'Camilan & Minuman', icon: Coffee, time: 'Sepanjang Hari' },
    };

    const handleDateChange = (days: number) => {
        const current = new Date(date);
        current.setDate(current.getDate() + days);
        const nextDate = current.toISOString().split('T')[0];
        router.visit(route('nutrition.index', { date: nextDate }));
    };

    // AI File Upload and Analysis
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoPreview(URL.createObjectURL(file));
        setScanning(true);
        setAiError(null);
        setAiItems([]);
        setAiDishName('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const xsrfCookie = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                || (xsrfCookie ? decodeURIComponent(xsrfCookie) : '');

            const res = await fetch(route('nutrition.scan'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(
                    res.status === 419
                        ? 'Sesi kadaluarsa. Silakan muat ulang halaman dan coba lagi.'
                        : `Gagal memproses gambar (${res.status}). Respons server tidak valid.`
                );
            }

            const json = await res.json();
            if (res.ok && json.success && json.data) {
                setAiDishName(json.data.dish_name || 'Piring Makanan');
                setAiItems(
                    json.data.items.map((i: any) => ({
                        name: i.name,
                        portion_g: i.portion_g,
                        calories: i.calories,
                        protein: i.protein,
                        carbs: i.carbs,
                        fat: i.fat,
                        source: 'ai_scanner',
                        indonesian_food_id: i.food_id,
                    }))
                );
            } else {
                setAiError(json.message || 'Gagal mengenali makanan dari gambar.');
            }
        } catch (err: any) {
            console.error('Scan failed', err);
            setAiError(err.message || 'Terjadi kesalahan saat menghubungi layanan AI Scanner.');
        } finally {
            setScanning(false);
        }
    };

    // Live AI item portion adjuster
    const handleAdjustAiItemPortion = (index: number, newPortion: number) => {
        setAiItems((prev) => {
            const updated = [...prev];
            const item = updated[index];
            const oldPortion = item.portion_g || 100;
            const ratio = newPortion / (oldPortion > 0 ? oldPortion : 1);

            item.portion_g = newPortion;
            item.calories = Math.round(item.calories * ratio * 10) / 10;
            item.protein = Math.round(item.protein * ratio * 10) / 10;
            item.carbs = Math.round(item.carbs * ratio * 10) / 10;
            item.fat = Math.round(item.fat * ratio * 10) / 10;

            return updated;
        });
    };

    const handleRemoveAiItem = (index: number) => {
        setAiItems((prev) => prev.filter((_, i) => i !== index));
    };

    // Save AI Scanned items
    const handleSaveAiItems = () => {
        if (aiItems.length === 0) return;

        const items = aiItems.map((item) => ({
            indonesian_food_id: item.indonesian_food_id,
            portion_g: item.portion_g,
            source: 'ai_scanner' as const,
        }));

        if (items.some((item) => !item.indonesian_food_id)) {
            setAiError('Semua makanan harus cocok dengan database sebelum disimpan.');
            return;
        }

        router.post(
            route('nutrition.store'),
            {
                meal_type: selectedMeal,
                date: date,
                notes: `AI Scan: ${aiDishName}`,
                items,
            },
            {
                onSuccess: () => {
                    setShowAiModal(false);
                    setAiItems([]);
                    setPhotoPreview(null);
                },
            }
        );
    };

    // Search Database
    useEffect(() => {
        if (!showSearchModal) return;
        const timeout = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(route('nutrition.search', { q: searchQuery }));
                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery, showSearchModal]);

    // Save Selected Food from DB
    const handleSaveDbFood = () => {
        if (!selectedDbFood) return;

        const ratio = dbPortion / (selectedDbFood.serving_size_g || 100);
        const item: FoodItem = {
            name: selectedDbFood.name,
            portion_g: dbPortion,
            calories: Math.round(selectedDbFood.calories * ratio),
            protein: Math.round(selectedDbFood.protein * ratio * 10) / 10,
            carbs: Math.round(selectedDbFood.carbs * ratio * 10) / 10,
            fat: Math.round(selectedDbFood.fat * ratio * 10) / 10,
            source: 'database',
            indonesian_food_id: selectedDbFood.id,
        };

        router.post(
            route('nutrition.store'),
            {
                meal_type: selectedMeal,
                date: date,
                items: [{
                    indonesian_food_id: selectedDbFood.id,
                    portion_g: dbPortion,
                    source: 'database',
                }],
            },
            {
                onSuccess: () => {
                    setShowSearchModal(false);
                    setSelectedDbFood(null);
                    setSearchQuery('');
                },
            }
        );
    };

    const handleSearchBarcode = async (codeToSearch?: string) => {
        const code = codeToSearch || barcodeInput;
        if (!code.trim()) return;

        setBarcodeLoading(true);
        setBarcodeError(null);
        try {
            const res = await fetch(route('nutrition.barcode', { barcode: code }));
            const data = await res.json();
            if (data.success && data.product) {
                setBarcodeProduct(data.product);
                setBarcodePortion(data.product.portion_g || 100);
            } else {
                setBarcodeProduct(null);
                setBarcodeError(data.message || 'Produk barcode tidak ditemukan.');
            }
        } catch (err) {
            console.error('Barcode fetch failed', err);
            setBarcodeError('Layanan barcode sedang tidak tersedia.');
        } finally {
            setBarcodeLoading(false);
        }
    };

    const handleSaveBarcodeProduct = () => {
        if (!barcodeProduct) return;

        const ratio = barcodePortion / (barcodeProduct.portion_g || 100);
        const item: FoodItem = {
            name: barcodeProduct.name,
            portion_g: barcodePortion,
            calories: Math.round(barcodeProduct.calories * ratio),
            protein: Math.round(barcodeProduct.protein * ratio * 10) / 10,
            carbs: Math.round(barcodeProduct.carbs * ratio * 10) / 10,
            fat: Math.round(barcodeProduct.fat * ratio * 10) / 10,
            source: 'manual',
        };

        router.post(
            route('nutrition.store'),
            {
                meal_type: selectedMeal,
                date: date,
                notes: `Barcode: ${barcodeProduct.barcode}`,
                items: [item],
            },
            {
                onSuccess: () => {
                    setShowBarcodeModal(false);
                    setBarcodeProduct(null);
                    setBarcodeInput('');
                },
            }
        );
    };

    const handleDeleteItem = (itemId: number) => {
        if (confirm('Hapus item makanan ini?')) {
            router.delete(route('nutrition.item.destroy', { item: itemId }));
        }
    };

    // Percentage of targets
    const calPercent = Math.min(100, Math.round((consumed.calories / target.calories) * 100));
    const proPercent = Math.min(100, Math.round((consumed.protein / target.protein) * 100));
    const carbPercent = Math.min(100, Math.round((consumed.carbs / target.carbs) * 100));
    const fatPercent = Math.min(100, Math.round((consumed.fat / target.fat) * 100));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-athletic text-3xl sm:text-4xl tracking-tight text-slate-950">
                            NUTRITION & AI FOOD SCANNER
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                            Read the plate. Keep the signal.
                        </p>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200/90 p-1.5 shadow-sm">
                        <button
                            onClick={() => handleDateChange(-1)}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-800">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            <span className="font-display text-sm tracking-wide">{date}</span>
                        </div>
                        <button
                            onClick={() => handleDateChange(1)}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Nutrition & AI Food Scanner - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#111827] text-white shadow-xl shadow-slate-900/10">
                        <img src={visualAssets.food} alt="Mangkuk makanan segar berwarna-warni" className="absolute inset-y-0 right-0 h-full w-2/5 object-cover opacity-55" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-transparent" />
                        <div className="relative max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]"><Camera className="h-3.5 w-3.5" /> Food signal / TKPI</span>
                            <h2 className="mt-4 font-athletic text-5xl uppercase leading-[0.88] sm:text-6xl">Your plate is part of the training.</h2>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Scan makanan Indonesia, cek porsinya, dan lihat bagaimana pilihan hari ini mengisi budget energi kamu.</p>
                            <button type="button" onClick={() => { setSelectedMeal('breakfast'); setShowAiModal(true); }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c8f169] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#111827] transition hover:bg-white"><Camera className="h-3.5 w-3.5" /> Scan a plate</button>
                        </div>
                    </section>

                    {/* Top Macro Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Calories */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kalori Harian</span>
                                <Flame className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-athletic text-4xl sm:text-5xl text-slate-950">{consumed.calories}</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">/ {target.calories} KCAL</span>
                            </div>
                            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${calPercent}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 font-medium">
                                Sisa <strong className="font-display text-sm font-black text-emerald-700">{Math.max(0, target.calories - consumed.calories)}</strong> KCAL
                            </p>
                        </div>

                        {/* Protein */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protein</span>
                                <span className="font-display font-black text-xs text-violet-700">{proPercent}%</span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-athletic text-4xl sm:text-5xl text-violet-700">{consumed.protein}g</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">/ {target.protein}g</span>
                            </div>
                            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${proPercent}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-slate-400 font-medium">Pemulihan otot & rasa kenyang</p>
                        </div>

                        {/* Carbs */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Karbohidrat</span>
                                <span className="font-display font-black text-xs text-amber-700">{carbPercent}%</span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-athletic text-4xl sm:text-5xl text-amber-700">{consumed.carbs}g</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">/ {target.carbs}g</span>
                            </div>
                            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${carbPercent}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-slate-400 font-medium">Bahan bakar aktivitas & olahraga</p>
                        </div>

                        {/* Fat */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lemak Sehat</span>
                                <span className="font-display font-black text-xs text-rose-700">{fatPercent}%</span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-athletic text-4xl sm:text-5xl text-rose-700">{consumed.fat}g</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">/ {target.fat}g</span>
                            </div>
                            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${fatPercent}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-slate-400 font-medium">Keseimbangan hormon & sel tubuh</p>
                        </div>
                    </div>

                    {/* Meal Cards Section */}
                    <div className="space-y-6">
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealKey) => {
                            const meta = mealTitles[mealKey];
                            const currentLog = logs.find((l) => l.meal_type === mealKey);

                            return (
                                <div key={mealKey} className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 shadow-sm">
                                                <meta.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-display font-black text-xl tracking-wide text-slate-900 uppercase">
                                                    {meta.label}
                                                </h3>
                                                <p className="text-xs text-slate-400 font-medium">{meta.time}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {currentLog && currentLog.total_calories > 0 && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                                                    <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                    <span className="font-display font-black text-sm">{currentLog.total_calories}</span> KCAL
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedMeal(mealKey);
                                                    setShowAiModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
                                            >
                                                <Camera className="h-3.5 w-3.5" />
                                                Scan AI
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMeal(mealKey);
                                                    setShowBarcodeModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                                            >
                                                <Barcode className="h-3.5 w-3.5 text-slate-500" />
                                                Barcode
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMeal(mealKey);
                                                    setShowSearchModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                                            >
                                                <Search className="h-3.5 w-3.5 text-slate-400" />
                                                Cari Makanan
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    {currentLog && currentLog.items.length > 0 ? (
                                        <div className="mt-4 divide-y divide-slate-100">
                                            {currentLog.items.map((item) => (
                                                <div key={item.id} className="py-3 flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-sm text-slate-900">{item.name}</p>
                                                            {item.source === 'ai_scanner' && (
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                                    AI Vision
                                                                </span>
                                                            )}
                                                            {item.source === 'database' && (
                                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                                                    TKPI
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                            {item.portion_g}g · P: {item.protein}g · K: {item.carbs}g · L: {item.fat}g
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-display font-bold text-base text-slate-800">
                                                            {item.calories} <span className="text-xs text-slate-400 font-normal">kcal</span>
                                                        </span>
                                                        <button
                                                            onClick={() => item.id && handleDeleteItem(item.id)}
                                                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 font-medium">
                                            Belum ada makanan yang dicatat untuk {meta.label.toLowerCase()}.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI SCANNER MODAL */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-display font-black text-xl tracking-wide uppercase text-slate-900 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-emerald-600" />
                                    AI Food Scanner
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    Estimasi porsi visual & kalkulasi nutrisi server-side berdasarkan database TKPI.
                                </p>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Upload / Camera Dropzone */}
                        {!photoPreview ? (
                            <label className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 py-12 px-4 cursor-pointer hover:bg-emerald-50 transition-all group">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                                    <Camera className="h-7 w-7" />
                                </div>
                                <span className="font-bold text-sm text-emerald-950">Ambil Foto / Upload Gambar Piring</span>
                                <span className="text-xs text-emerald-700/70 mt-1 font-medium">Format didukung: JPG, PNG, WEBP (Maks 10MB)</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-2xl overflow-hidden max-h-56 w-full bg-slate-900 flex items-center justify-center border border-slate-800">
                                    <img src={photoPreview} alt="Food preview" className="object-cover h-full w-full opacity-85" />
                                    {scanning && (
                                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                                            <Loader2 className="h-9 w-9 animate-spin text-emerald-400 mb-2" />
                                            <p className="font-display font-black text-lg tracking-wide uppercase">Calora AI Vision</p>
                                            <p className="text-xs text-slate-300 text-center font-medium mt-1">Mengidentifikasi makanan & menghitung nutrisi database...</p>
                                        </div>
                                    )}
                                </div>

                                {aiError && (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-2">
                                        <p className="font-bold">{aiError}</p>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhotoPreview(null);
                                                    setAiError(null);
                                                }}
                                                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-white hover:bg-rose-500 font-bold"
                                            >
                                                Pilih Foto Lain
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!scanning && aiItems.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                            <div>
                                                <h4 className="font-display font-black text-base text-slate-900 uppercase">
                                                    Hasil Deteksi: {aiDishName}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    Geser porsi (gram) atau hapus bahan sebelum disimpan.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Correction Cards */}
                                        <div className="space-y-2.5">
                                            {aiItems.map((item, idx) => (
                                                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-display font-bold text-xs text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                                                {item.calories} KCAL
                                                            </span>
                                                            <button
                                                                onClick={() => handleRemoveAiItem(idx)}
                                                                className="text-slate-300 hover:text-rose-600 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-xs font-semibold text-slate-600">Porsi:</span>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="400"
                                                                step="5"
                                                                value={item.portion_g}
                                                                onChange={(e) => handleAdjustAiItemPortion(idx, Number(e.target.value))}
                                                                className="w-full accent-emerald-600"
                                                            />
                                                            <span className="font-display font-black text-sm text-slate-800 w-12 text-right">{item.portion_g}g</span>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            P:{item.protein}g · K:{item.carbs}g · L:{item.fat}g
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Save Action */}
                                        <button
                                            onClick={handleSaveAiItems}
                                            className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check className="h-4 w-4" />
                                            Simpan ke {mealTitles[selectedMeal].label}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SEARCH DATABASE MODAL */}
            {showSearchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] flex flex-col border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-display font-black text-xl tracking-wide uppercase text-slate-900 flex items-center gap-2">
                                    <Utensils className="h-5 w-5 text-emerald-600" />
                                    Cari Makanan Nusantara (TKPI)
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    Database resmi komposisi pangan Kementerian Kesehatan RI.
                                </p>
                            </div>
                            <button onClick={() => setShowSearchModal(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ketik nama makanan (cth: Nasi, Ayam, Rendang, Soto)..."
                                className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                                autoFocus
                            />
                        </div>

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {searching && <p className="text-center text-xs text-slate-400 py-6 font-medium">Mencari database makanan...</p>}
                            {!searching && searchResults.map((food) => (
                                <div
                                    key={food.id}
                                    onClick={() => setSelectedDbFood(food)}
                                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                        selectedDbFood?.id === food.id
                                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                                            : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm text-slate-900">{food.name}</p>
                                        <span className="font-display font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                            {food.calories} KCAL / 100g
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">
                                        {food.category} · P: {food.protein}g · K: {food.carbs}g · L: {food.fat}g
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Portion adjustment & Submit */}
                        {selectedDbFood && (
                            <div className="border-t border-slate-100 pt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Takaran Porsi:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={dbPortion}
                                            onChange={(e) => setDbPortion(Number(e.target.value))}
                                            className="w-24 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-right focus:border-emerald-500"
                                            min="5"
                                        />
                                        <span className="text-xs font-bold text-slate-400 uppercase">gram</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveDbFood}
                                    className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
                                >
                                    Tambahkan ke {mealTitles[selectedMeal].label}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BARCODE SCANNER MODAL (Open Food Facts) */}
            {showBarcodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-display font-black text-xl tracking-wide uppercase text-slate-900 flex items-center gap-2">
                                    <Barcode className="h-5 w-5 text-emerald-600" />
                                    Scan Barcode Produk Kemasan
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    Didukung Open Food Facts untuk membaca data nutrisi kemasan.
                                </p>
                            </div>
                            <button onClick={() => setShowBarcodeModal(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Barcode Search Form */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearchBarcode();
                            }}
                            className="space-y-3"
                        >
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Ketik / Scan Nomor Barcode</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Contoh: 8998866200388"
                                    className="flex-1 rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={barcodeLoading || !barcodeInput.trim()}
                                    className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    {barcodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Cari
                                </button>
                            </div>

                            {/* Quick sample chips */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 pt-1 font-medium">
                                <span>Contoh cepat:</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBarcodeInput('8998866200388');
                                        handleSearchBarcode('8998866200388');
                                    }}
                                    className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 transition-colors font-semibold text-slate-600"
                                >
                                    Indomie Goreng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBarcodeInput('8992775211116');
                                        handleSearchBarcode('8992775211116');
                                    }}
                                    className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 transition-colors font-semibold text-slate-600"
                                >
                                    Ultra Milk Cokelat
                                </button>
                            </div>
                            {barcodeError && (
                                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 border border-rose-200">
                                    {barcodeError}
                                </p>
                            )}
                        </form>

                        {/* Barcode Product Result */}
                        {barcodeProduct && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                            {barcodeProduct.source}
                                        </span>
                                        <h4 className="font-bold text-base text-gray-900 mt-0.5">{barcodeProduct.name}</h4>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                        {barcodeProduct.calories} kcal
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="rounded-xl bg-white p-2 border border-emerald-100">
                                        <span className="text-[10px] text-gray-400 block">PROTEIN</span>
                                        <span className="font-bold text-gray-900">{barcodeProduct.protein}g</span>
                                    </div>
                                    <div className="rounded-xl bg-white p-2 border border-emerald-100">
                                        <span className="text-[10px] text-gray-400 block">KARBO</span>
                                        <span className="font-bold text-gray-900">{barcodeProduct.carbs}g</span>
                                    </div>
                                    <div className="rounded-xl bg-white p-2 border border-emerald-100">
                                        <span className="text-[10px] text-gray-400 block">LEMAK</span>
                                        <span className="font-bold text-gray-900">{barcodeProduct.fat}g</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-emerald-200/60 pt-3">
                                    <span className="text-xs font-semibold text-gray-700">Porsi / Gramasi:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={barcodePortion}
                                            onChange={(e) => setBarcodePortion(Number(e.target.value))}
                                            className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-right focus:border-emerald-500"
                                            min="1"
                                        />
                                        <span className="text-xs text-gray-500">gram</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveBarcodeProduct}
                                    className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Check className="h-4 w-4" />
                                    Simpan ke {mealTitles[selectedMeal].label}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
