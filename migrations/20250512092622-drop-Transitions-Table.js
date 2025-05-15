'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('Transitions');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('Transitions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      trick_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tricks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      from_trick_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tricks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      to_trick_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Tricks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
      await queryInterface.addIndex('Transitions', ['trick_id']);
      await queryInterface.addIndex('Transitions', ['from_trick_id']);
      await queryInterface.addIndex('Transitions', ['to_trick_id']);
  }
};
