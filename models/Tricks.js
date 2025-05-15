module.exports = (sequelize, DataTypes) => {
    const Trick = sequelize.define('tricks', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        ownerId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        visibility: {
            type: DataTypes.ENUM('everyone', 'friends', 'only_me'),
            allowNull: false,
            defaultValue: 'friends'
        },
        edit_perms: {
            type: DataTypes.ENUM('public', 'friends', 'only_me'),
            allowNull: false,
            defaultValue: 'only_me'
        },
        

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sudoNames: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('sudoNames');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('sudoNames', JSON.stringify(value));
            },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        difficulty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tags: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('tags');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('tags', JSON.stringify(value));
            },
        },
        images: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('images');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('images', JSON.stringify(value));
            },
        },
        videos: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('videos');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('videos', JSON.stringify(value));
            },
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
        from: {
            type: DataTypes.INTEGER,
            references: {
              model: 'tricks',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
        to: {
            type: DataTypes.INTEGER,
            references: {
                model: 'tricks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
    });
    Trick.associate = (models) => {
        Trick.belongsTo(models.tricks, { as: 'FromTrick', foreignKey: 'from' });
        Trick.belongsTo(models.tricks, { as: 'ToTrick', foreignKey: 'to' });
        Trick.belongsTo(models.Users, { as: "owner", foreignKey: 'ownerId' });
        Trick.belongsToMany(models.Users, {
          through: 'tricks_granted_users',
          foreignKey: 'trick_id',
          otherKey: 'user_id',
        });
        Trick.hasMany(models.tricks_granted_users, { foreignKey: 'trick_id' });
      };

    return Trick;

};

