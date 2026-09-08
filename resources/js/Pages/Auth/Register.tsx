import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar Akun - Calora" />

            <div className="mb-6 text-center space-y-1">
                <h1 className="font-athletic text-4xl tracking-wide text-slate-950">
                    Buat Akun Calora
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                    Mulai lacak nutrisi dan latihan fisikmu secara gratis.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Nama Lengkap" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1.5 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        placeholder="Nama kamu"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-1.5 text-xs text-rose-400 font-medium" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Alamat Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1.5 block w-full"
                        autoComplete="username"
                        placeholder="nama@email.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400 font-medium" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Kata Sandi" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1.5 block w-full"
                        autoComplete="new-password"
                        placeholder="Minimal 8 karakter"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-1.5 text-xs text-rose-400 font-medium" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Konfirmasi Kata Sandi"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1.5 block w-full"
                        autoComplete="new-password"
                        placeholder="Ketik ulang kata sandi"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5 text-xs text-rose-400 font-medium"
                    />
                </div>

                <div className="pt-3">
                    <PrimaryButton className="w-full py-3.5 text-sm font-display font-black tracking-wider" disabled={processing}>
                        {processing ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                    </PrimaryButton>
                </div>

                <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                    Sudah memiliki akun?{' '}
                    <Link
                        href={route('login')}
                        className="font-bold text-[#fc4c02] hover:text-slate-950 hover:underline transition-colors"
                    >
                        Masuk di Sini
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
