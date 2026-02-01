import { redirect } from "next/navigation";

import NewCategoryForm from "@/app/categories/new/NewCategoryForm";
import { authServer } from "@/lib/auth/server";

export default async function NewCategoryPage() {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    redirect("/auth/sign-in");
  }

  return <NewCategoryForm />;
}
