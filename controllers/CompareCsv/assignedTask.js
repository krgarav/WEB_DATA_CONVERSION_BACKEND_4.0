const { where } = require("sequelize");
const Assigndata = require("../../models/TempleteModel/assigndata");
const Template = require("../../models/TempleteModel/templete");
const groupByPrimaryKey = require("../../services/groupingCsvData")
const User = require("../../models/User");

const assignedTask = async (req, res) => {
  try {
    const assignData = await Assigndata.findAll();

    const mappedAssignedData = await Promise.all(
      assignData.map(async (data) => {
        const { id, userId,taskName, templeteId, max, min, taskStatus, moduleType } =
          data;
        const user = await User.findOne({ where: { id: userId } });
        // const template = await Template.findOne({ where: { id: templeteId } });

        return {
          userName: user.userName,
          taskName: taskName,
          moduleType: moduleType,
          max,
          min,
          taskStatus,
          id,
        };
      })
    );
    res.status(200).send({
      message: " File found successfuly ",
      assignedData: mappedAssignedData,
    });
  } catch (error) {
    res.status(500).send({
      message: "An error occurred while retrieving the data",
      error: error.message,
    });
  }
};

module.exports = assignedTask;
