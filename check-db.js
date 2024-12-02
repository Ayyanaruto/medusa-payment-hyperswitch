const { Client } = require("pg");
const { exec } = require("child_process");
require("dotenv").config();

async function checkDatabaseConnection() {
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log("✓ Successfully connected to the database");

    // Optionally, run a simple query to verify
    const res = await client.query("SELECT NOW()");
    console.log("✓ Database is responding");

    // Run migrations and seed the database
    exec("npx run db:migrate && npm run seed", (error, stdout, stderr) => {
      if (error) {
        console.error(`✗ Error running migrations or seeding: ${error.message}`);
        process.exit(1);
      }
      console.log(stdout);
      console.error(stderr);
      console.log("✓ Migrations and seeding completed successfully");
      client.end();
      process.exit(0);
    });
  } catch (error) {
    console.error("✗ Failed to connect to database:", error.message);
    process.exit(1);
  }
}

checkDatabaseConnection();
