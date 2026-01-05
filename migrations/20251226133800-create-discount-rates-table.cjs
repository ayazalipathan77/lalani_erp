export function setup(options, seedLink) {
  // No setup needed for this simple migration
}

export async function up(db) {
  return db.createTable('discount_rates', {
    columns: {
      discount_id: {
        type: 'int',
        primaryKey: true,
        autoIncrement: true
      },
      discount_code: {
        type: 'string',
        length: 20,
        unique: true,
        notNull: true
      },
      discount_name: {
        type: 'string',
        length: 100,
        notNull: true
      },
      discount_rate: {
        type: 'decimal',
        precision: 5,
        scale: 2,
        notNull: true
      },
      description: {
        type: 'text'
      },
      is_active: {
        type: 'boolean',
        defaultValue: true
      },
      comp_code: {
        type: 'string',
        length: 10,
        defaultValue: 'CMP01'
      },
      created_at: {
        type: 'timestamp',
        defaultValue: new String('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'timestamp',
        defaultValue: new String('CURRENT_TIMESTAMP')
      }
    },
    ifNotExists: true
  });
}

export async function down(db) {
  return db.dropTable('discount_rates');
}

export const _meta = {
  version: 1
};
