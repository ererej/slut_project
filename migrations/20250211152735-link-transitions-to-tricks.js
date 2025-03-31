'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Step 1: Add new columns with the correct data type
    await queryInterface.addColumn('transitions', 'to_temp', {
      type: Sequelize.INTEGER,
      references: {
        model: 'tricks',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('transitions', 'from_temp', {
      type: Sequelize.INTEGER,
      references: {
        model: 'tricks',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Step 2: Copy data from old columns to new columns
    // Assuming you have a way to map the string values to integer IDs
    // This step will vary depending on your specific data and requirements
    await queryInterface.sequelize.query(`
      UPDATE transitions
      SET to_temp = (SELECT id FROM tricks WHERE tricks.name = transitions.to),
          from_temp = (SELECT id FROM tricks WHERE tricks.name = transitions.from)
    `);

    // Step 3: Remove old columns
    await queryInterface.removeColumn('transitions', 'to');
    await queryInterface.removeColumn('transitions', 'from');

    // Step 4: Rename new columns to the original names
    await queryInterface.renameColumn('transitions', 'to_temp', 'to');
    await queryInterface.renameColumn('transitions', 'from_temp', 'from');
  },

  async down (queryInterface, Sequelize) {
    // Revert the changes by adding the old columns back
    await queryInterface.addColumn('transitions', 'to_temp', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn('transitions', 'from_temp', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Copy data back from new columns to old columns
    await queryInterface.sequelize.query(`
      UPDATE transitions
      SET to_temp = (SELECT name FROM tricks WHERE tricks.id = transitions.to),
          from_temp = (SELECT name FROM tricks WHERE tricks.id = transitions.from)
    `);

    // Remove new columns
    await queryInterface.removeColumn('transitions', 'to');
    await queryInterface.removeColumn('transitions', 'from');

    // Rename old columns back to the original names
    await queryInterface.renameColumn('transitions', 'to_temp', 'to');
    await queryInterface.renameColumn('transitions', 'from_temp', 'from');
  }
};