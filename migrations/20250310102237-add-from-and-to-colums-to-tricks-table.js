'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tricks', 'from', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'tricks',
        key: 'id'
      }
    });

    await queryInterface.addColumn('tricks', 'to', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'tricks',
        key: 'id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tricks', 'from');
    await queryInterface.removeColumn('tricks', 'to');
  }
};
