/**
 * Create workshops table
 */
export async function up(knex) {
  return knex.schema.createTable('workshops', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.text('description');
    table.string('instructor').notNullable();
    table.datetime('date').notNullable();
    table.string('location').notNullable();
    table.integer('total_seats').notNullable();
    table.integer('price').notNullable(); // in VND
    table.datetime('registration_start_date').notNullable();
    table.datetime('registration_end_date').notNullable();
    table.string('status').defaultTo('active'); // 'active', 'cancelled', 'completed'
    table.timestamps(true, true);
    
    // Indexes
    table.index('date');
    table.index('status');
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('workshops');
}
