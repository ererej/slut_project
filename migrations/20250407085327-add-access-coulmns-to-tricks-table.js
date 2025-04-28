'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tricks', 'owner', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('tricks', 'visibility', {
      type: Sequelize.ENUM('everyone', 'friends', 'only_me'),
      allowNull: false,
      defaultValue: 'friends'
    });

    await queryInterface.addColumn('tricks', 'edit_perms', {
      type: Sequelize.ENUM('public', 'friends', 'only_me'),
      allowNull: false,
      defaultValue: 'only_me'
    });

    await queryInterface.createTable('tricks_granted_users', {
      trick_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tricks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tricks', 'owner');
    await queryInterface.removeColumn('tricks', 'visibility');
    await queryInterface.removeColumn('tricks', 'edit_perms');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tricks_visibility";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tricks_edit_perms";');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "tricks_granted_users";');
  }
};
