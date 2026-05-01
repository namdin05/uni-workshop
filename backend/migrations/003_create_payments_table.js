/**
 * Create payments table
 */
export async function up(knex) {
  return knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('registration_id').notNullable().references('id').inTable('registrations');
    table.string('order_id').notNullable().unique();
    table.integer('amount').notNullable(); // in VND
    table.string('transaction_id').unique();
    table.string('status').notNullable(); // 'pending', 'completed', 'failed', 'cancelled'
    table.string('payment_method');
    table.text('error_message');
    table.timestamps(true, true);
    
    // Indexes
    table.index('registration_id');
    table.index('order_id');
    table.index('status');
    table.index('created_at');
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('payments');
}
