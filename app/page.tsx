import { cacheLife } from "next/cache";
import HomePageTemplate from "@/app/components/templates/HomePageTemplate";
import { sql } from "@/app/lib/db";

async function getDbVersion() {
  "use cache";
  cacheLife("days");

  const result = await sql`SELECT version()`;
  return result[0].version as string;
}

export default async function Home() {
  const version = await getDbVersion();

  return <HomePageTemplate version={version} />;
}
