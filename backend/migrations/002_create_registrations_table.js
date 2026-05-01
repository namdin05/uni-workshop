/**
 * Create registrations table
 */
export async function up(knex) {
  return knex.schema.createTable('registrations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('workshop_id').notNullable().references('id').inTable('workshops');
    table.string('user_id').notNullable(); // Can be user ID or anonymous
    table.string('full_name').notNullable();
    table.string('email').notNullable();
    table.string('phone').notNullable();
    table.string('status').notNullable(); // 'pending', 'confirmed', 'cancelled'
    table.string('idempotency_key').unique();
    table.datetime('expires_at'); // 10 minutes from creation
    table.datetime('paid_at');
    table.datetime('cancelled_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index('workshop_id');
    table.index('user_id');
    table.index('status');
    table.index('idempotency_key');
    table.index('created_at');
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('registrations');
}
