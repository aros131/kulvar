module.exports = (sequelize, DataTypes) => {
  const Program = sequelize.define('Program', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Program.associate = (models) => {
    Program.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  };

  return Program;
};
