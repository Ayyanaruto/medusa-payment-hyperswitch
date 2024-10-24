const { DataSource } = require("typeorm");
const {projectConfig} = require("./medusa-config");
try {
const AppDataSource = new DataSource({
  type: "postgres",
  port: 5432,
    url: projectConfig.database_url,
  entities: ["dist/models/*.js"],
  migrations: ["dist/migrations/*.js"],
  
});
module.exports = {
  datasource: AppDataSource,
};
} catch (e) {
  console.error(e);
}