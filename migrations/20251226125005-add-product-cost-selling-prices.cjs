export function setup(options, seedLink) {
  // No setup needed for this simple migration
}

export async function up(db) {
  // Add cost_price column
  await db.addColumn('products', 'cost_price', {
    type: 'decimal',
    precision: 12,
    scale: 2,
    defaultValue: 0
  });

  // Rename unit_price to selling_price
  await db.renameColumn('products', 'unit_price', 'selling_price');

  // Copy existing unit_price values to selling_price (though renamed, values should persist)
  // If purchase_price exists, copy to cost_price
  await db.runSql(`
    UPDATE products SET cost_price = COALESCE(purchase_price, 0) WHERE cost_price = 0;
    ALTER TABLE products DROP COLUMN IF EXISTS purchase_price;
  `);
}

export async function down(db) {
  // Add back purchase_price
  await db.addColumn('products', 'purchase_price', {
    type: 'decimal',
    precision: 12,
    scale: 2,
    defaultValue: 0
  });

  // Rename selling_price back to unit_price
  await db.renameColumn('products', 'selling_price', 'unit_price');

  // Copy cost_price back to purchase_price
  await db.runSql(`
    UPDATE products SET purchase_price = cost_price WHERE purchase_price = 0;
  `);

  // Drop cost_price
  await db.removeColumn('products', 'cost_price');
}

export const _meta = {
  version: 1
};
