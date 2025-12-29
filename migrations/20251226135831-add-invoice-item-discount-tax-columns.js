import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setup(options, seedLink) {
  // No setup needed for this simple migration
}

export async function up(db) {
  const filePath = path.join(__dirname, 'sqls', '20251226135831-add-invoice-item-discount-tax-columns-up.sql');
  const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return db.runSql(data);
}

export async function down(db) {
  const filePath = path.join(__dirname, 'sqls', '20251226135831-add-invoice-item-discount-tax-columns-down.sql');
  const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return db.runSql(data);
}

export const _meta = {
  version: 1
};
