const Assigndata = require("../../models/TempleteModel/assigndata");

const taskUpdation = async (req, res, next) => {
  const assignId = req.params.id;

  const { taskStatus } = req.body;

  try {
    const assignData = await Assigndata.findOne({ where: { id: assignId } });

    if (!assignData) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Correct usage of update method
    await assignData.update({
      taskStatus: taskStatus,
    });
    assignData.save();
    return res.status(200).json({ message: "Task Completed successfully" });
  } catch (error) {
    console.error("Error updating data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = taskUpdation;
