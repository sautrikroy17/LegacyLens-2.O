import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dbType, host, port, user, password, database, uri } = body;

    if (!dbType) return NextResponse.json({ error: "No DB Type specified." }, { status: 400 });

    if (dbType === "mysql") {
      const connection = await mysql.createConnection({
        host: host || 'localhost',
        port: parseInt(port) || 3306,
        user,
        password,
        database,
        connectTimeout: 5000,
      });

      const schemaData: any = {};
      const [tables]: any = await connection.query('SHOW TABLES');
      const tableKey = Object.keys(tables[0] || {})[0];

      for (const row of tables) {
        const tableName = row[tableKey];
        const [columns]: any = await connection.query(`DESCRIBE \`${tableName}\``);
        schemaData[tableName] = columns.map((col: any) => ({
          name: col.Field,
          type: col.Type,
        }));
      }
      
      await connection.end();

      // Convert schemaData to a string chunk for Gemini
      const schemaString = Object.entries(schemaData).map(([tbl, cols]: [string, any]) => {
         return `Table ${tbl} (${cols.map((c: any) => `${c.name} ${c.type}`).join(', ')});`;
      }).join('\n');

      return NextResponse.json({ success: true, schemaString });

    } else if (dbType === "mongodb") {
      let connectionUri = uri;
      if (!uri) {
        if (user && password) connectionUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host || 'localhost'}:${port || 27017}/${database}`;
        else connectionUri = `mongodb://${host || 'localhost'}:${port || 27017}/${database}`;
      }

      const client = new MongoClient(connectionUri!, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db(database);
      const collections = await db.listCollections().toArray();
      const schemaData: any = {};

      for (const col of collections) {
        const collection = db.collection(col.name);
        const samples = await collection.find({}).limit(5).toArray();
        const fields = new Set<string>();
        samples.forEach(doc => Object.keys(doc).forEach(k => fields.add(k)));
        schemaData[col.name] = { type: 'collection', fields: Array.from(fields) };
      }

      await client.close();

      const schemaString = Object.entries(schemaData).map(([col, data]: [string, any]) => {
         return `Collection ${col} (Fields: ${data.fields.join(', ')});`;
      }).join('\n');

      return NextResponse.json({ success: true, schemaString });
    }

    return NextResponse.json({ error: "Unsupported dbType" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 400 });
  }
}
