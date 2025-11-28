import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("little_lemon.db");

export const createTable = async () => {
  await db.execAsync(`


    CREATE TABLE IF NOT EXISTS menuitems (
      id INTEGER PRIMARY KEY NOT NULL,   
      title TEXT NOT NULL,
      price TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `);
};

export const getMenuItems = async () => {
  return await db.getAllAsync("SELECT * FROM menuitems");
};

export const saveMenuItems = async (menuItems) => {
  if (!menuItems?.length) return;

  const placeholders = menuItems.map(() => "(?, ?, ?, ?)").join(", ");
  const values = menuItems.flatMap((item) => [
    item.id,
    item.title,
    item.price.toString(),
    item.category,
  ]);

  await db.runAsync(
    `INSERT OR REPLACE INTO menuitems (id, title, price, category) VALUES ${placeholders}`,
    values
  );
};

export const filterByQueryAndCategories = async (
  query = "",
  categories = []
) => {
  let sql = "SELECT * FROM menuitems";
  const params = [];

  if (categories.length > 0) {
    sql += ` WHERE category IN (${categories.map(() => "?").join(", ")})`;
    params.push(...categories);
  }

  const results = await db.getAllAsync(sql, params);

  if (!query.trim()) return results;

  const lowerQuery = query.toLowerCase();
  return results.filter((item) =>
    item.title.toLowerCase().includes(lowerQuery)
  );
};
