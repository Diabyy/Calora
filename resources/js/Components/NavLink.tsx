import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-xs font-bold uppercase tracking-wider transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-emerald-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900') +
                className
            }
        >
            {children}
        </Link>
    );
}
