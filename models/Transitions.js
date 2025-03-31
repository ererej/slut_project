module.exports = (sequelize, DataTypes) => {
    return sequelize.define('transitions', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        from: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        to: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        difficulty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sudoNames: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tags: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        images: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        videos: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        external_links: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
}