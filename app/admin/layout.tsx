import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";

import { requireAdmin, AuthorizationError } from "@/libs/authorization";

async function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  let errorStatus: number | null = null;

  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      errorStatus = error.statusCode;
    } else {
      throw error;
    }
  }

  if (errorStatus === 401) {
    redirect("/admin-login");
  }

  if (errorStatus === 403) {
    notFound();
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
          <p className="text-sm text-gray-500">
            Đang kiểm tra quyền quản trị...
          </p>
        </div>
      }
    >
      <ProtectedAdmin>{children}</ProtectedAdmin>
    </Suspense>
  );
}
