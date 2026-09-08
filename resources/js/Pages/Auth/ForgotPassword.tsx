import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi - Calora" />

            <div className="mb-6 text-center space-y-1">
                <h1 className="font-athletic text-4xl tracking-wide text-slate-950">
                    Reset Kata Sandi
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                    Masukkan email akunmu dan kami akan mengirim tautan pemulihan kata sandi.
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-400 text-center">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        isFocused={true}
                        placeholder="nama@email.com"
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400 font-medium" />
                </div>

                <div className="pt-2">
                    <PrimaryButton className="w-full py-3.5 text-sm font-display font-black tracking-wider" disabled={processing}>
                        {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
