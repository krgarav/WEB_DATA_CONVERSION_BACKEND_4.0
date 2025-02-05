const Templete = require("../../models/TempleteModel/templete");
const MetaData = require("../../models/TempleteModel/metadata");

const getTemplete = (req, res, next) => {
  const userPermission = req.permissions;

  if (userPermission.dataEntry !== true) {
    return res.status(500).json({ message: "user not authorised" });
  }
  try {
    Templete.findAll({
      include: [
        {
          model: MetaData,
          attributes: {
            exclude: ["id", "templeteId", "createdAt", "updatedAt"], // Specify the fields to be excluded
          },
        },
      ],
    })
      .then((data) => {
        
        res.status(200).json(data);
      })
      .catch((error) => {
        // Catch any errors that occur during the promise chain
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = getTemplete;
