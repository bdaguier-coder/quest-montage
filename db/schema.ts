import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const films=sqliteTable('montage_films',{
 ownerId:text('owner_id').notNull(),
 projectId:text('project_id').notNull(),
 revision:integer('revision').notNull(),
 projectJson:text('project_json').notNull(),
 updatedAt:integer('updated_at').notNull()
},table=>[primaryKey({columns:[table.ownerId,table.projectId]})]);
export const filmVersions=sqliteTable('montage_film_versions',{
 ownerId:text('owner_id').notNull(),
 projectId:text('project_id').notNull(),
 revision:integer('revision').notNull(),
 projectJson:text('project_json').notNull(),
 updatedAt:integer('updated_at').notNull()
},table=>[primaryKey({columns:[table.ownerId,table.projectId,table.revision]})]);
