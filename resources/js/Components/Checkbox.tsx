import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-slate-700 bg-slate-800 text-emerald-500 shadow-sm focus:ring-emerald-400 focus:ring-offset-slate-900 ' +
                className
            }
        />
    );
}
