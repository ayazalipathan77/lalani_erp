export function setup(options, seedLink) {
  // No setup needed for this simple migration
}

export async function up(db) {
  await db.addColumn('discount_rates', 'created_by', {
    type: 'int',
    references: {
      table: 'users',
      column: 'user_id'
    }
  });

  await db.addColumn('discount_rates', 'updated_by', {
    type: 'int',
    references: {
      table: 'users',
      column: 'user_id'
    }
  });
}

export async function down(db) {
  await db.removeColumn('discount_rates', 'created_by');
  await db.removeColumn('discount_rates', 'updated_by');
}

export const _meta = {
  version: 1
};
