import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("categories")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("neon_auth.user.id").onDelete("cascade"),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addUniqueConstraint("categories_user_id_name_unique", ["user_id", "name"])
    .addUniqueConstraint("categories_user_id_id_unique", ["user_id", "id"])
    .execute();

  await db.schema
    .createTable("assets")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("user_id", "uuid", (col) =>
      col.notNull().references("neon_auth.user.id").onDelete("cascade"),
    )
    .addColumn("category_id", "uuid", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("kind", "text", (col) => col.notNull().defaultTo("manual"))
    .addColumn("ticker_symbol", "text", (col) => col.notNull())
    .addColumn("quantity", "numeric", (col) => col.notNull().defaultTo(1))
    .addColumn("value_cents", "bigint", (col) => col.notNull().defaultTo(100))
    .addColumn("price_updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("wallet_address", "text")
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addForeignKeyConstraint(
      "assets_user_id_category_id_fk",
      ["user_id", "category_id"],
      "categories",
      ["user_id", "id"],
      (cb) => cb.onDelete("restrict"),
    )
    .execute();

  await db.schema
    .createIndex("categories_user_id_index")
    .on("categories")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("assets_user_id_index")
    .on("assets")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("assets_category_id_index")
    .on("assets")
    .column("category_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("assets").execute();
  await db.schema.dropTable("categories").execute();
}
