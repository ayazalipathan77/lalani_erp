exports.up = function (knex) {
    return knex.schema
        .table('sales_invoice_items', function (table) {
            table.decimal('discount_rate', 5, 2).defaultTo(0.00);
            table.decimal('discount_amount', 12, 2).defaultTo(0.00);
            table.decimal('tax_rate', 5, 2).defaultTo(5.00);
            table.decimal('tax_amount', 12, 2).defaultTo(0.00);
            table.decimal('net_amount', 12, 2).defaultTo(0.00);
        })
        .table('sales_return_items', function (table) {
            table.decimal('discount_rate', 5, 2).defaultTo(0.00);
            table.decimal('discount_amount', 12, 2).defaultTo(0.00);
            table.decimal('tax_rate', 5, 2).defaultTo(5.00);
            table.decimal('tax_amount', 12, 2).defaultTo(0.00);
            table.decimal('net_amount', 12, 2).defaultTo(0.00);
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('sales_invoice_items', function (table) {
            table.dropColumn('discount_rate');
            table.dropColumn('discount_amount');
            table.dropColumn('tax_rate');
            table.dropColumn('tax_amount');
            table.dropColumn('net_amount');
        })
        .table('sales_return_items', function (table) {
            table.dropColumn('discount_rate');
            table.dropColumn('discount_amount');
            table.dropColumn('tax_rate');
            table.dropColumn('tax_amount');
            table.dropColumn('net_amount');
        });
};