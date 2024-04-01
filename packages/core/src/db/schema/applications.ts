import {
  pgTable,
  text,
  varchar,
  timestamp,
  index,
  serial,
} from "drizzle-orm/pg-core";

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobTitle: varchar("job_title", { length: 100 }).notNull(),
    company: varchar("company", { length: 100 }).notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return {
      nameIdx: index("userId_idx").on(table.userId),
    };
  }
);
