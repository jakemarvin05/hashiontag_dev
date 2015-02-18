
======
Brief:
======
O:O, set up a:

    Parent.hasOne(Child, {foreignKey: 'Parent_parentId'})
    Child.belongsTo(Parent, {foreignKey: 'Parent_parentId'})

O:M, set up:

    Parent.hasMany(Child, {foreignKey: 'Parent_parentId'})
    Child.belongsTo(Parent, {foreignKey: 'Parent_parentId'})

N:M, set up:

    Parent.belongsToMany(Child, {foreignKey: 'Parent_parentId', through: 'Parent_Child'})
    Child.hasMany(Parent, {foreignKey: 'Child_childId', through: 'Parent_Child})


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


hasMany()/belongsToMany():
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


==================================
Table and keys naming conventions
==================================

TableNames: PascalCase

keys: camelCase

foreignkeys: TableNameInPascalCase_foreignKeyInCamelCase

Example: User_pictureId
Meaning: This key of pictureId came from the User table.


For crosstables, except for self referencing crosstable, all crosstables should be named in TableName_TableName2.

