import { redirect } from "next/navigation";

import NewAssetForm from "@/app/assets/new/NewAssetForm";
import { getCategoryNamesForUser } from "@/app/lib/services/categories.service";
import { authServer } from "@/lib/auth/server";

export default async function NewAssetPage() {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    redirect("/auth/sign-in");
  }

  const categoryNames = await getCategoryNamesForUser(data.user.id);

  return <NewAssetForm categoryNames={categoryNames} />;
}
