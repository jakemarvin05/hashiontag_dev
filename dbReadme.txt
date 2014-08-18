
======
Brief:
======
O:O, set up a Parent.hasOne(Child) AND Child.belongsTo(Parent).
O:M, set up Parent.hasMany(Child) AND Child.belongsTo(Parent).
M:M, set up Parent.hasMany(Child) and Child.hasMany(Parent)


=====================================================
Methods gained by hasOne(), hasMany() and belongsTo()
=====================================================

hasOne():
---------

In setting a Parent.hasOne(Child), methods available to Parent:

parent.getChild,
parent.setChild,
parent.addChild,
parent.createChild,
parent.removeChild,
parent.hasChild


hasMany():
----------

In setting a Parent.hasMany(Child), methods available to Parent:

parent.getChildren,
parent.setChildren,
parent.addChild,
parent.createChild,
parent.removeChild,
parent.hasChild,
parent.hasChildren


belongsTo():
------------

In setting a child.belongsTo(Parent), methods available to Child:

child.getParent,
child.setUser,
child.createUser


=============================================================
The syntax for setting up relationships. And our conventions
=============================================================
To understand why we do the above associations we start off by knowing what are the methods we gain for each model.

For O:O, and O:M:
------------------

Parent.hasOne(Child);
Child.belongsTo(Parent, {foreignKey: Parent_childID});

Note that we explicitly defined our foreignKeys to be Parent_childID. This is because we want this PascalCase_camelCase for TableName_keyName convention.

In the first line, hasOne method, sequelize looks for the Child table and inject the foreignKey.

In the second line, belongsTo method, sequelize will inject the table itself (in this case the Child table) with the foreignKey. b

So both lines create the same table configurations, why not just use one?

Invoking belongTo() is for the purpose of gaining the belongsTo() methods above.
Note: Therefore it is also important to make sure both foreignKeys defined are identical to prevent unpredictable over-writting.



Many to Many relationship
-------------------------

For a M:M relationship, do this:

parent.hasMany(AnotherParent, {
  as: [Relationship],
  through: [Parent_AnotherParent] 
});

AnotherParent.hasMany(Parent, {
  as: [Relationship2],
  through: [Parent_AnotherParent] 
});

This will create all the hasMany() methods on both sides. You don't need belongTo() in this situation.

As a standard, using the "through" key, we explicitly define all the crosstable names for consistency and less gotchas.

The above will create the Parent_AnotherParent, with RelationshipId and Relationship2ID.

We DO NOT want to define foreignKeys like how we do in a O:M relationship because sequelize has some issues here. So we let Sequelize handle that in a default way.




==================================
Table and keys naming conventions
==================================

TableNames: PascalCase

keys: camelCase

foreignkeys: TableNameInPascalCase_foreignKeyInCamelCase

Example: User_pictureId
Meaning: This key of pictureId came from the User table.


For crosstables, except for self referencing crosstable, all crosstables should be named in TableName_TableName2. Only the naming convention for the keys inside of the crosstables are handled by sequelize.

