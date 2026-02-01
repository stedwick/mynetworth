import { promises as fs } from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from "kysely";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: databaseUrl }),
  }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(process.cwd(), "migrations"),
  }),
});

const action = process.argv[2] ?? "latest";
const isDown = action === "down";

try {
  const { error, results } = isDown
    ? await migrator.migrateDown()
    : await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === "Success") {
      console.log(`migration "${result.migrationName}" executed`);
    } else if (result.status === "Error") {
      console.error(`migration "${result.migrationName}" failed`);
    }
  });

  if (error) {
    throw error;
  }
} finally {
  await db.destroy();
}
