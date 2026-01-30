import { TagHandler, TagHandlerContext } from '../types';

console.log('[mongodb tag] mongodb.ts loaded');
import { MongoClient, Db, Collection } from 'mongodb';

// Utility to expand variables/child tags as Dirac does
async function expandContent(ctx: TagHandlerContext): Promise<any> {
  if (ctx.body) {
    // If body is present, expand it (could be JSON, array, or object)
    const expanded = await ctx.evaluate(ctx.body);
    try {
      return JSON.parse(expanded);
    } catch {
      return expanded;
    }
  }
  return undefined;
}

export const mongodb: TagHandler = async (ctx: TagHandlerContext) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const database = ctx.getAttr('database');
  const collection = ctx.getAttr('collection');
  const action = ctx.getAttr('action');
  const client = new MongoClient(uri);
  let result;
  console.log('[mongodb tag] Connecting to:', uri);
  console.log('[mongodb tag] Database:', database, 'Collection:', collection, 'Action:', action);
  try {
    await client.connect();
    let db: Db | undefined = database ? client.db(database) : undefined;
    let col: Collection | undefined = db && collection ? db.collection(collection) : undefined;
    const content = await expandContent(ctx);
    console.log('[mongodb tag] Query content:', content);
    switch (action) {
      case 'find':
        if (!col) throw new Error('Collection required for find');
        result = await col.find(content || {}).toArray();
        console.log('[mongodb tag] Find result:', result);
        break;
      case 'aggregate':
        if (!col) throw new Error('Collection required for aggregate');
        result = await col.aggregate(content).toArray();
        console.log('[mongodb tag] Aggregate result:', result);
        break;
      case 'insert':
        if (!col) throw new Error('Collection required for insert');
        result = await col.insertOne(content);
        console.log('[mongodb tag] Insert result:', result);
        break;
      case 'createDb':
        if (!db) throw new Error('Database required for createDb');
        result = { db: database, created: true };
        console.log('[mongodb tag] CreateDb result:', result);
        break;
      case 'createCollection':
        if (!db || !collection) throw new Error('Database and collection required');
        result = await db.createCollection(collection);
        console.log('[mongodb tag] CreateCollection result:', result);
        break;
      default:
        throw new Error('Unknown action for <mongodb>');
    }
  } finally {
    await client.close();
  }
  return result;
};

export default mongodb;
