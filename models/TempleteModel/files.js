const Sequelize = require("sequelize");


const sequelize = require("../../utils/database");

const Files = sequelize.define("filedata", {
  // id: {
  //   type: Sequelize.INTEGER,
  //   autoIncrement: true,
  //   allowNull: false,
  //   primaryKey: true,
  // }, 
  csvFile: {
    type: Sequelize.STRING,
    defaultValue: null,
  },

  zipFile: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
});

module.exports = Files;
