import AiAssistantDrawer from '@/Components/AiAssistantDrawer';
import Dropdown from '@/Components/Dropdown';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Camera,
    ChevronDown,
    Home,
    LogOut,
    Play,
    Settings2,
    Sparkles,
    Trophy,
    User,
    Users,
    Utensils,
} from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const desktopNavigation = [
        { label: 'Overview', href: route('dashboard'), active: route().current('dashboard'), icon: Home },
        { label: 'Nutrition', href: route('nutrition.index'), active: route().current('nutrition.*'), icon: Utensils },
        { label: 'Activities', href: route('activities.index'), active: route().current('activities.*'), icon: Activity },
        { label: 'Progress', href: route('progress.index'), active: route().current('progress.*'), icon: BarChart3 },
        { label: 'Challenges', href: route('challenges.index'), active: route().current('challenges.*'), icon: Trophy },
        { label: 'Community', href: route('community.index'), active: route().current('community.*'), icon: Users },
    ];

    const mobileLeftNavigation = [
        { label: 'Overview', href: route('dashboard'), active: route().current('dashboard'), icon: Home },
        { label: 'Nutrition', href: route('nutrition.index'), active: route().current('nutrition.*'), icon: Camera },
    ];

    const mobileRightNavigation = [
        { label: 'Activities', href: route('activities.index'), active: route().current('activities.*'), icon: Activity },
        { label: 'Progress', href: route('progress.index'), active: route().current('progress.*'), icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-[#f4f2ed] text-slate-900 antialiased">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#111827] text-white md:flex">
                <div className="flex h-full flex-col px-5 py-6">
                    <Link href={route('dashboard')} className="group flex items-center gap-3 px-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c8f169] font-athletic text-3xl text-[#111827] transition-transform group-hover:-rotate-6">
                            C
                        </span>
                        <span>
                            <span className="block font-athletic text-3xl leading-none tracking-tight text-white">CALORA</span>
                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Field manual</span>
                        </span>
                    </Link>

                    <div className="mt-10 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c8f169]" />
                        System Menu
                    </div>

                    <nav className="mt-3 space-y-1.5">
                        {desktopNavigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                                        item.active
                                            ? 'bg-white text-[#111827] shadow-lg shadow-black/10'
                                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon
                                        className={`h-[18px] w-[18px] ${item.active ? 'text-[#111827]' : 'text-slate-400 group-hover:text-[#c8f169]'}`}
                                        strokeWidth={1.9}
                                    />
                                    {item.label}
                                    {item.active && <span className="ms-auto h-2 w-2 rounded-full bg-[#fc4c02]" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto space-y-4">
                        <Link
                            href={route('activities.index')}
                            className="group relative block overflow-hidden rounded-2xl bg-[#c8f169] p-4 text-[#111827] shadow-md transition hover:shadow-lime-900/10"
                        >
                            <div className="relative z-10">
                                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em]">
                                    <Play className="h-3 w-3 fill-current" />
                                    Start Session
                                </span>
                                <span className="mt-3 block font-athletic text-2xl leading-none">MOVE WITH INTENT.</span>
                            </div>
                            <Activity
                                className="absolute -bottom-5 -right-4 h-24 w-24 rotate-12 text-[#a5d147] transition-transform group-hover:rotate-0"
                                strokeWidth={1}
                            />
                        </Link>

                        {/* Desktop Dropup Profile Menu (Opens upwards to prevent clipping at bottom) */}
                        <div className="border-t border-white/10 pt-4">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/10"
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fc4c02] font-athletic text-lg font-black text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-white">{user.name}</span>
                                            <span className="block truncate text-[11px] text-slate-400">Personal Account</span>
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-slate-400 rotate-180" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content
                                    direction="up"
                                    align="left"
                                    width="full"
                                    contentClasses="bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5"
                                >
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2.5 py-2.5">
                                        <User className="h-4 w-4 text-slate-400" />
                                        Profil & Akun
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('onboarding.show')} className="flex items-center gap-2.5 py-2.5">
                                        <Settings2 className="h-4 w-4 text-slate-400" />
                                        Pengaturan Target
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('community.index')} className="flex items-center gap-2.5 py-2.5">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        Komunitas
                                    </Dropdown.Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-2.5 py-2.5 text-rose-600 hover:text-rose-700 font-bold"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="min-h-screen md:pl-64">
                {/* Streamlined, Breathable Top Bar (Fixed 56px on mobile, 64px on desktop) */}
                <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-slate-200/80 bg-[#f4f2ed]/90 backdrop-blur-xl">
                    <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
                        {/* Left: Mobile Brand & Contextual Header */}
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <Link
                                href={route('dashboard')}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111827] font-athletic text-lg text-[#c8f169] md:hidden shadow-sm active:scale-95 transition-transform"
                                aria-label="Calora Home"
                            >
                                C
                            </Link>
                            <div className="min-w-0 flex-1 truncate">{header}</div>
                        </div>

                        {/* Right: Mobile User Menu (Desktop uses the clean sidebar dropup) */}
                        <div className="flex shrink-0 items-center gap-2 md:hidden">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fc4c02] font-athletic text-sm font-black text-white shadow-sm active:scale-95 transition-transform"
                                        aria-label="Menu Pengguna"
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="56" contentClasses="bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-1.5">
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2.5 py-2.5">
                                        <User className="h-4 w-4 text-slate-400" />
                                        Profil & Akun
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('onboarding.show')} className="flex items-center gap-2.5 py-2.5">
                                        <Settings2 className="h-4 w-4 text-slate-400" />
                                        Pengaturan Target
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('community.index')} className="flex items-center gap-2.5 py-2.5">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        Komunitas
                                    </Dropdown.Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-2.5 py-2.5 text-rose-600 hover:text-rose-700"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Page Content with safe padding on mobile for bottom nav */}
                <main className="pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-12">{children}</main>
            </div>

            {/* Mobile Bottom Navigation with Center FAB (Original Nike/Strava style from contohui/Ui.jpeg) */}
            <nav
                className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-slate-200/90 bg-white/95 px-3 pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden pb-safe"
                style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {/* 1. Left Tab 1: Overview (Home) */}
                {mobileLeftNavigation.slice(0, 1).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${
                                item.active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${item.active ? 'text-[#fc4c02]' : ''}`} strokeWidth={item.active ? 2.4 : 1.8} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* 2. Left Tab 2: Nutrition (Camera scanner) */}
                {mobileLeftNavigation.slice(1, 2).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${
                                item.active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${item.active ? 'text-[#fc4c02]' : ''}`} strokeWidth={item.active ? 2.4 : 1.8} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* 3. Center Elevated FAB: Record (GPS Run/Session) */}
                <div className="flex flex-col items-center -mt-6 px-1">
                    <Link
                        href={route('activities.index')}
                        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#f4f2ed] bg-[#c8f169] text-[#111827] shadow-lg shadow-lime-900/25 active:scale-95 transition-transform"
                        aria-label="Mulai Sesi Olahraga GPS"
                        title="Record GPS"
                    >
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                    </Link>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 mt-0.5">
                        Record
                    </span>
                </div>

                {/* 4. Right Tab 1: Activities */}
                {mobileRightNavigation.slice(0, 1).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${
                                item.active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${item.active ? 'text-[#fc4c02]' : ''}`} strokeWidth={item.active ? 2.4 : 1.8} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* 5. Right Tab 2: Progress */}
                {mobileRightNavigation.slice(1, 2).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${
                                item.active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${item.active ? 'text-[#fc4c02]' : ''}`} strokeWidth={item.active ? 2.4 : 1.8} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <PwaInstallPrompt />
            <AiAssistantDrawer />
        </div>
    );
}
