import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-athletic text-3xl sm:text-4xl tracking-tight text-slate-950">
                        PROFILE & ACCOUNT
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                        Manage your athlete credentials and security
                    </p>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
