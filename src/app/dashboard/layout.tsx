import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("leadflow_auth");

  if (!auth || auth.value !== "true") {
    redirect("/login");
  }

  return <>{children}</>;
}