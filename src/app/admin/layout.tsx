import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  
  // RBAC Check: Only admins can access /admin routes
  if (user?.publicMetadata?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminSidebar />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
