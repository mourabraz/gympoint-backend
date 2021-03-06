// eslint-disable-next-line import/no-extraneous-dependencies
const faker = require('faker');
const { addMonths, startOfDay, endOfDay } = require('date-fns');
const { Client } = require('pg');

const configDB = require('../../config/database');

const client = new Client({
  host: configDB.host,
  user: configDB.username,
  password: configDB.password,
  database: configDB.database,
  port: 5432,
});

module.exports = {
  up: async queryInterface => {
    client.connect(err => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('connection error', err.stack);
      } else {
        // eslint-disable-next-line no-console
        console.log('connected');
      }
    });
    let plans = await client.query('SELECT * FROM plans');
    plans = plans.rows;

    let registrationsOld = await client.query(
      'SELECT * FROM registrations WHERE registrations.end_date < $1',
      [new Date(2019, 10, 30, 0, 0, 0)]
    );
    const arr = new Array(registrationsOld.rowCount);
    registrationsOld = registrationsOld.rows;

    const registrations = Array.from(arr).map((item, index) => {
      const start_date = startOfDay(
        faker.date.between(registrationsOld[index].end_date, new Date())
      );
      const plan =
        plans[faker.random.number({ min: 0, max: plans.length - 1 })];

      const end_date = endOfDay(addMonths(start_date, plan.duration));

      return {
        student_id: registrationsOld[index].student_id,
        plan_id: plan.id,
        price: plan.price * plan.duration,
        start_date,
        end_date,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    await client.end();

    return queryInterface.bulkInsert('registrations', registrations, {});
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('registrations', null, {});
  },
};
