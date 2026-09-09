import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { isMigrationFile, migrationName, pendingMigrations } from "./migration-plan.mjs";

/** The workspace root (this file lives in `<root>/scripts/`). */
function projectRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

test("_migrations keys on basename, not path", () => {
  assert.equal(migrationName("/migrations/0002_todos.sql"), "0002_todos.sql");
  assert.equal(migrationName("migrations/0001_init.sql"), "0001_init.sql");
  assert.equal(migrationName("0001_init.sql"), "0001_init.sql");
});

test("a file already applied does not re-apply", () => {
  assert.deepEqual(pendingMigrations(["/migrations/0001_init.sql"], ["0001_init.sql"]), []);
});

test("pending migrations are returned in name order", () => {
  assert.deepEqual(
    pendingMigrations(
      ["/migrations/0003_c.sql", "/migrations/0001_a.sql", "/migrations/0002_b.sql"],
      ["0001_a.sql"],
    ),
    [
      { name: "0002_b.sql", path: "/migrations/0002_b.sql" },
      { name: "0003_c.sql", path: "/migrations/0003_c.sql" },
    ],
  );
});

test("non-.sql entries are dropped (readdir also yields non-migration files)", () => {
  assert.equal(isMigrationFile("README.md"), false);
  assert.deepEqual(pendingMigrations(["README.md"], []), []);
});

test("this workspace's migrations are all real .sql files with unique names", () => {
  const migrationsDir = join(projectRoot(), "migrations");
  const entries = readdirSync(migrationsDir);
  assert.ok(entries.length > 0, "expected at least one migration file");
  for (const entry of entries) assert.ok(isMigrationFile(entry), `${entry} is not a .sql file`);
  const names = entries.map(migrationName);
  assert.deepEqual(names, [...new Set(names)], "migration basenames must be unique");
});
