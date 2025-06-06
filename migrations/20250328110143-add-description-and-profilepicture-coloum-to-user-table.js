'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'profilePicture', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'description');
    await queryInterface.removeColumn('Users', 'profilePicture');
  }
};
