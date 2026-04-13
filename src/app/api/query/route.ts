import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getDemoSchema } from '@/lib/db';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nlQuery, executeSql, dbType, credentials, schemaString } = body;
    
    const activeDbType = dbType || 'sqlite';
    const activeSchema = schemaString || getDemoSchema();

    // Step 2: EXECUTE verified SQL / Mongo Query
    if (executeSql) {
      try {
        if (activeDbType === 'sqlite') {
          const dbResult = executeQuery(executeSql);
          return NextResponse.json({ results: dbResult });
        } 
        
        if (activeDbType === 'mysql') {
          const connection = await mysql.createConnection({
            host: credentials.host || 'localhost',
            port: parseInt(credentials.port) || 3306,
            user: credentials.user,
            password: credentials.password,
            database: credentials.database,
            multipleStatements: false,
            connectTimeout: 5000,
          });
          const cleanSql = executeSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
          const [rows]: any = await connection.query(cleanSql);
          await connection.end();
          
          if (Array.isArray(rows)) {
            const safeRows = rows.map((r: any) => {
               const o: any = {};
               for (const [k,v] of Object.entries(r)) { o[k] = typeof v === 'bigint' ? v.toString() : v; }
               return o;
            });
            return NextResponse.json({ results: safeRows });
          } else {
            return NextResponse.json({ results: [{ affectedRows: rows.affectedRows || 0 }] });
          }
        }
        
        if (activeDbType === 'mongodb') {
           let connectionUri = credentials.uri;
           if (!connectionUri) {
             connectionUri = (credentials.user && credentials.password) 
               ? `mongodb://${encodeURIComponent(credentials.user)}:${encodeURIComponent(credentials.password)}@${credentials.host || 'localhost'}:${credentials.port || 27017}/${credentials.database}`
               : `mongodb://${credentials.host || 'localhost'}:${credentials.port || 27017}/${credentials.database}`;
           }

           let op = typeof executeSql === 'string' ? JSON.parse(executeSql) : executeSql;
           if (typeof executeSql === 'string' && executeSql.includes('\`')) {
              op = JSON.parse(executeSql.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, ""));
           }
           
           const client = new MongoClient(connectionUri, { serverSelectionTimeoutMS: 5000 });
           await client.connect();
           const db = client.db(credentials.database || 'test');
           const collection = db.collection(op.collection);

           let docs = [];
           if (op.operation === 'find') {
             docs = await collection.find(op.filter || {}, { projection: op.projection }).limit(op.limit || 100).toArray();
           } else if (op.operation === 'aggregate') {
             docs = await collection.aggregate(op.pipeline || []).toArray();
           } else {
             docs = [{ message: `Operation ${op.operation} completed. Write logic bypassed safely for demo.` }];
           }
           await client.close();

           return NextResponse.json({ results: docs });
        }
      } catch (e: any) {
        return NextResponse.json({ executionError: e.message }, { status: 400 });
      }
    }

    // Step 1: GENERATE (Using robust fallback AI API without key limitations)
    if (!nlQuery) return NextResponse.json({ error: "Empty query provided." }, { status: 400 });

    let systemInstruction = "";
    if (activeDbType === 'mongodb') {
      systemInstruction = `You are a MongoDB Database query generator. Return ONLY a valid JSON object matching this structure based on the user requirement. Do not wrap in markdown.\n{ "operation": "find|aggregate", "collection": "<name>", "filter": {}, "pipeline": [] }\n\nSchema:\n${activeSchema}`;
    } else {
      systemInstruction = `You are a SQL Database query generator. Convert natural language queries into ONLY raw SQL queries targeting the provided schema. Return nothing but the valid raw SQL string (no explanation text, no backticks). Permitted operations include all standard data manipulation (SELECT, DELETE, UPDATE, INSERT, REPLACE, etc). Use standard ${activeDbType} syntax.\n\nSchema:\n${activeSchema}`;
    }

    try {
      const resp = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: nlQuery }
          ]
        })
      });

      if (!resp.ok) throw new Error("Free AI endpoint overloaded too.");

      let generated = await resp.text();
      generated = generated.trim();
      
      if (activeDbType !== 'mongodb') {
         generated = generated.replace(/^\`\`\`sql/i, '').replace(/^\`\`\`/i, '').replace(/\`\`\`$/i, '').trim();
      } else {
         generated = generated.replace(/^\`\`\`json/i, '').replace(/^\`\`\`/i, '').replace(/\`\`\`$/i, '').trim();
      }
      
      return NextResponse.json({ generatedSql: generated });
    } catch (fallbackError) {
      return NextResponse.json({ error: "All AI inference engines are currently at maximum capacity online. Please wait 10 seconds." }, { status: 503 });
    }

  } catch (error: any) {
    console.error("API Query Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error." }, { status: 500 });
  }
}
