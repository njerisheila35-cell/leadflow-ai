"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const password = formData.get("password") as string;
  const correctPassword = process.env.DASHBOARD_PASSWORD || "admin123";

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("leadflow_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    redirect("/dashboard");
  } else {
    redirect("/login?error=Invalid password");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("leadflow_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  redirect("/login");
}