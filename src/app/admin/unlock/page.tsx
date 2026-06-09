import AdminUnlockForm from "@/components/admin/admin-unlock-form";

type PageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function AdminUnlockPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextUrl = params.next || "/admin";

  return <AdminUnlockForm nextUrl={nextUrl} />;
}