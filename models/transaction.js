"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Define associations here.
     */
    static associate(models) {
      Transaction.belongsTo(models.User, { foreignKey: "userId" });
      Transaction.belongsTo(models.Program, { foreignKey: "programId" });
    }
  }

  Transaction.init(
    {
      userId: DataTypes.INTEGER,
      programId: DataTypes.INTEGER,
      amount: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "Transactions", // Optional but explicit
    }
  );

  return Transaction;
};
