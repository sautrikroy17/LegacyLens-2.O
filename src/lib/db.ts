import Database from 'better-sqlite3';

const db = new Database('demo.db');
db.pragma('journal_mode = WAL');

const initDb = () => {
  // We use IF NOT EXISTS, but the tables might be old, so let's allow it to grow if empty
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      age INTEGER,
      role TEXT,
      country TEXT,
      status TEXT,
      created_at DATE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      category TEXT,
      price DECIMAL(10,2)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      amount DECIMAL(10,2),
      status TEXT,
      order_date DATE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = stmt.get() as { count: number };
  
  if (result.count === 0) {
    console.log("Seeding EXPANDED Demo SQLite Database with sample data...");
    
    const insertUser = db.prepare('INSERT INTO users (name, email, age, role, country, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertProduct = db.prepare('INSERT INTO products (product_name, category, price) VALUES (?, ?, ?)');
    const insertOrder = db.prepare('INSERT INTO orders (user_id, product_id, amount, status, order_date) VALUES (?, ?, ?, ?, ?)');
    
    // Seed 10 Products
    const categories = ['Electronics', 'Software', 'Hardware', 'Accessories'];
    for(let i=1; i<=10; i++) {
        insertProduct.run(`Product ${i}X`, categories[i % categories.length], (Math.random() * 900 + 10).toFixed(2));
    }

    // Seed 150 dummy users
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'India'];
    const statuses = ['active', 'active', 'active', 'inactive', 'suspended'];
    const roles = ['admin', 'user', 'user', 'user', 'moderator'];
    
    for (let i = 1; i <= 150; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const age = Math.floor(Math.random() * 50) + 18; // 18 to 67
      const date = new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0];
      
      insertUser.run(`User ${i}`, `user${i}@example.com`, age, role, country, status, date);
      
      // Random 0 to 8 orders per user
      const numOrders = Math.floor(Math.random() * 8);
      for (let j = 0; j < numOrders; j++) {
        const amt = (Math.random() * 500 + 20).toFixed(2);
        const oStatus = Math.random() > 0.2 ? 'completed' : (Math.random() > 0.5 ? 'pending' : 'refunded');
        const productId = Math.floor(Math.random() * 10) + 1;
        insertOrder.run(i, productId, amt, oStatus, date);
      }
    }
    console.log("Seeding complete! 150 Users, 10 Products, and hundreds of orders inserted.");
  }
};

initDb();

export const executeQuery = (sql: string) => {
  const stmt = db.prepare(sql);
  if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA') || sql.trim().toUpperCase().startsWith('EXPLAIN')) {
    return stmt.all();
  } else {
    // We allow modification for the demo, but it returns changes
    const result = stmt.run();
    return [{ operation: "Executed Write Operation", changes: result.changes, lastInsertRowid: result.lastInsertRowid.toString() }];
  }
};

export const getDemoSchema = () => {
  return [
    "Table USERS (id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER, role TEXT, country TEXT, status TEXT, created_at DATE);",
    "Table PRODUCTS (id INTEGER PRIMARY KEY, product_name TEXT, category TEXT, price DECIMAL);",
    "Table ORDERS (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, amount DECIMAL, status TEXT, order_date DATE);"
  ].join("\n");
};
