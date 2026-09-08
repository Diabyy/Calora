import AiAssistantDrawer from '@/Components/AiAssistantDrawer';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Camera,
    ChevronDown,
    CircleUserRound,
    Home,
    Menu,
    Play,
    Settings2,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { label: 'Overview', href: route('dashboard'), active: route().current('dashboard'), icon: Home },
        { label: 'Nutrition', href: route('nutrition.index'), active: route().current('nutrition.*'), icon: Camera },
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
        <div className="min-h-screen bg-[#f4f2ed] text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#111827] text-white md:flex">
                <div className="flex h-full flex-col px-5 py-6">
                    <Link href={route('dashboard')} className="group flex items-center gap-3 px-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c8f169] font-athletic text-3xl text-[#111827] transition-transform group-hover:-rotate-6">
                            C
                        </span>
                        <span>
                            <span className="block font-athletic text-3xl leading-none tracking-tight text-white">CALORA</span>
                            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Field manual</span>
                        </span>
                    </Link>

                    <div className="mt-12 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c8f169]" />
                        Your daily system
                    </div>

                    <nav className="mt-4 space-y-1.5">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                                        item.active
                                            ? 'bg-white text-[#111827] shadow-lg shadow-black/10'
                                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon className={`h-[18px] w-[18px] ${item.active ? 'text-[#111827]' : 'text-slate-500 group-hover:text-[#c8f169]'}`} strokeWidth={1.8} />
                                    {item.label}
                                    {item.active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[#fc4c02]" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto space-y-4">
                        <Link
                            href={route('activities.index')}
                            className="group relative block overflow-hidden rounded-3xl bg-[#c8f169] p-4 text-[#111827]"
                        >
                            <div className="relative z-10">
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em]">
                                    <Play className="h-3 w-3 fill-current" />
                                    Start a session
                                </span>
                                <span className="mt-4 block font-athletic text-2xl leading-none">MOVE WITH INTENT.</span>
                            </div>
                            <Activity className="absolute -bottom-5 -right-4 h-24 w-24 rotate-12 text-[#a5d147] transition-transform group-hover:rotate-0" strokeWidth={1} />
                        </Link>

                        <div className="border-t border-white/10 pt-4">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button type="button" className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/10">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fc4c02] font-display text-lg font-black text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-white">{user.name}</span>
                                            <span className="block truncate text-[11px] text-slate-500">Personal account</span>
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-slate-500" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="left" contentClasses="bg-white">
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                        <p className="truncate text-xs text-slate-400">{user.email}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profil & akun
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('onboarding.show')}>
                                        Pengaturan target
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Keluar
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen md:pl-64">
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f4f2ed]/90 backdrop-blur-xl">
                    <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen((value) => !value)}
                                className="rounded-xl p-2 text-slate-500 hover:bg-white md:hidden"
                                aria-label="Buka menu navigasi"
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                            <div className="min-w-0">{header}</div>
                        </div>

                        <div className="hidden items-center gap-2 sm:flex">
                            <Link href={route('onboarding.show')} className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 lg:flex">
                                <Settings2 className="h-3.5 w-3.5 text-slate-400" />
                                Targets
                            </Link>
                            <Link href={route('activities.index')} className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#fc4c02]">
                                <Play className="h-3 w-3 fill-[#c8f169] text-[#c8f169]" />
                                Record
                            </Link>
                            <div className="ms-1 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                                <CircleUserRound className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    {mobileMenuOpen && (
                        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
                            <nav className="grid grid-cols-2 gap-2">
                                {navigation.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${item.active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fc4c02] text-sm font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
                                    <span className="text-xs font-bold text-slate-700">{user.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold">
                                    <Link href={route('profile.edit')} className="text-slate-500 hover:text-slate-900">Profile</Link>
                                    <Link href={route('logout')} method="post" as="button" className="text-[#fc4c02]">Log out</Link>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                <main className="pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-10">{children}</main>
            </div>

            {/* Mobile Bottom Navigation with Center FAB (Nike / Strava style) */}
            <nav
                className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-slate-200/90 bg-white/95 px-3 pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden pb-safe"
                style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                {mobileLeftNavigation.map((item) => {
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

                {/* Center Floating Action Button (Record GPS) */}
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

                {mobileRightNavigation.map((item) => {
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
