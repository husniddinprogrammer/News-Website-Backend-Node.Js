const {
  pgTable, pgEnum, serial, varchar, text,
  boolean, timestamp, integer, unique, index,
} = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// ─── Enums ───────────────────────────────────────────────────────────────────

const roleEnum = pgEnum('Role', ['BOSS', 'ADMIN', 'VIEWER']);
const newsStatusEnum = pgEnum('NewsStatus', ['DRAFT', 'PUBLISHED', 'DELETED']);

// ─── Users ───────────────────────────────────────────────────────────────────

const users = pgTable('users', {
  id:        serial('id').primaryKey(),
  username:  varchar('username', { length: 255 }).unique().notNull(),
  email:     varchar('email', { length: 255 }).unique().notNull(),
  password:  text('password').notNull(),
  role:      roleEnum('role').default('ADMIN').notNull(),
  name:      varchar('name', { length: 255 }).notNull(),
  surname:   varchar('surname', { length: 255 }).notNull(),
  isBlocked: boolean('isBlocked').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

const usersRelations = relations(users, ({ many }) => ({
  news:          many(news),
  comments:      many(comments),
  likes:         many(likes),
  refreshTokens: many(refreshTokens),
}));

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

const refreshTokens = pgTable('refresh_tokens', {
  id:        serial('id').primaryKey(),
  token:     text('token').unique().notNull(),
  userId:    integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

// ─── Categories ───────────────────────────────────────────────────────────────

const categories = pgTable('categories', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  slug:      varchar('slug', { length: 255 }).unique().notNull(),
  isDeleted: boolean('isDeleted').default(false).notNull(),
});

const categoriesRelations = relations(categories, ({ many }) => ({
  news: many(news),
}));

// ─── News ─────────────────────────────────────────────────────────────────────

const news = pgTable('news', {
  id:               serial('id').primaryKey(),
  title:            text('title').notNull(),
  slug:             varchar('slug', { length: 500 }).unique().notNull(),
  content:          text('content').notNull(),
  shortDescription: text('shortDescription').notNull(),
  categoryId:       integer('categoryId').notNull().references(() => categories.id),
  authorId:         integer('authorId').notNull().references(() => users.id),
  status:           newsStatusEnum('status').default('DRAFT').notNull(),
  viewCount:        integer('viewCount').default(0).notNull(),
  rank:             integer('rank').default(0).notNull(),
  createdAt:        timestamp('createdAt').defaultNow().notNull(),
  updatedAt:        timestamp('updatedAt').defaultNow().notNull(),
}, (t) => [
  index('news_slug_idx').on(t.slug),
  index('news_createdAt_idx').on(t.createdAt),
  index('news_categoryId_idx').on(t.categoryId),
  index('news_status_idx').on(t.status),
  index('news_authorId_idx').on(t.authorId),
  index('news_rank_idx').on(t.rank),
]);

const newsRelations = relations(news, ({ one, many }) => ({
  category: one(categories, { fields: [news.categoryId], references: [categories.id] }),
  author:   one(users,      { fields: [news.authorId],   references: [users.id] }),
  comments: many(comments),
  likes:    many(likes),
  views:    many(views),
  images:   many(images),
  hashtags: many(hashtagNews),
}));

// ─── Comments ─────────────────────────────────────────────────────────────────

const comments = pgTable('comments', {
  id:        serial('id').primaryKey(),
  newsId:    integer('newsId').notNull().references(() => news.id),
  userId:    integer('userId').notNull().references(() => users.id),
  content:   text('content').notNull(),
  username:  varchar('username', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  isDeleted: boolean('isDeleted').default(false).notNull(),
});

const commentsRelations = relations(comments, ({ one }) => ({
  news: one(news,  { fields: [comments.newsId], references: [news.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

// ─── Likes ────────────────────────────────────────────────────────────────────

const likes = pgTable('likes', {
  id:        serial('id').primaryKey(),
  userId:    integer('userId').references(() => users.id),
  newsId:    integer('newsId').notNull().references(() => news.id),
  ipAddress: varchar('ipAddress', { length: 100 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (t) => [
  unique('likes_unique').on(t.userId, t.newsId, t.ipAddress),
  index('likes_newsId_idx').on(t.newsId),
]);

const likesRelations = relations(likes, ({ one }) => ({
  news: one(news,  { fields: [likes.newsId], references: [news.id] }),
  user: one(users, { fields: [likes.userId], references: [users.id] }),
}));

// ─── Views ────────────────────────────────────────────────────────────────────

const views = pgTable('views', {
  id:        serial('id').primaryKey(),
  newsId:    integer('newsId').notNull().references(() => news.id),
  ipAddress: varchar('ipAddress', { length: 100 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

const viewsRelations = relations(views, ({ one }) => ({
  news: one(news, { fields: [views.newsId], references: [news.id] }),
}));

// ─── Hashtags ─────────────────────────────────────────────────────────────────

const hashtags = pgTable('hashtags', {
  id:   serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
});

const hashtagsRelations = relations(hashtags, ({ many }) => ({
  news: many(hashtagNews),
}));

// ─── HashtagNews ──────────────────────────────────────────────────────────────

const hashtagNews = pgTable('hashtag_news', {
  id:        serial('id').primaryKey(),
  hashtagId: integer('hashtagId').notNull().references(() => hashtags.id),
  newsId:    integer('newsId').notNull().references(() => news.id),
  isDeleted: boolean('isDeleted').default(false).notNull(),
}, (t) => [
  unique('hashtagnews_unique').on(t.hashtagId, t.newsId),
  index('hashtagnews_newsId_idx').on(t.newsId),
  index('hashtagnews_hashtagId_idx').on(t.hashtagId),
]);

const hashtagNewsRelations = relations(hashtagNews, ({ one }) => ({
  hashtag: one(hashtags, { fields: [hashtagNews.hashtagId], references: [hashtags.id] }),
  news:    one(news,     { fields: [hashtagNews.newsId],    references: [news.id] }),
}));

// ─── Images ───────────────────────────────────────────────────────────────────

const images = pgTable('images', {
  id:        serial('id').primaryKey(),
  newsId:    integer('newsId').notNull().references(() => news.id),
  url:       text('url').notNull(),
  isDeleted: boolean('isDeleted').default(false).notNull(),
});

const imagesRelations = relations(images, ({ one }) => ({
  news: one(news, { fields: [images.newsId], references: [news.id] }),
}));

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // enums
  roleEnum, newsStatusEnum,
  // tables
  users, refreshTokens, categories, news, comments,
  likes, views, hashtags, hashtagNews, images,
  // relations
  usersRelations, refreshTokensRelations, categoriesRelations,
  newsRelations, commentsRelations, likesRelations, viewsRelations,
  hashtagsRelations, hashtagNewsRelations, imagesRelations,
};
