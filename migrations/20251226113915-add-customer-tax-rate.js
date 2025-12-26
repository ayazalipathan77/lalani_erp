export function setup(options, seedLink) {
  // No setup needed for this simple migration
}

export async function up(db) {
  return db.addColumn('customers', 'tax_rate', {
    type: 'decimal',
    precision: 5,
    scale: 2,
    defaultValue: 0
  });
}

export async function down(db) {
  return db.removeColumn('customers', 'tax_rate');
}

export const _meta = {
  version: 1
};
