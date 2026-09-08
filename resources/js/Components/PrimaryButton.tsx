import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-display font-black text-xs uppercase tracking-wider text-white transition duration-150 ease-in-out hover:bg-[#fc4c02] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:bg-slate-800 shadow-sm ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
