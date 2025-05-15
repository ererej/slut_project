'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('tricks', 'owner', 'ownerId');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('tricks', 'ownerId', 'owner');
  }
};
