<!-- MongoDB operations library for Dirac -->
<dirac>
  <!-- General MongoDB subroutine: supports find, aggregate, insert, count -->
  <subroutine name="MONGODB"
   description="a tag to access mongodb"
   param-database="string:required:the database name::betting"
   param-collection="string:required:the collection name::events"
  param-action="string:required:the action need to take:find|aggregate|insert|count:find"
  meta-body="string:optional:the JSON query or document body for the action, required for find/aggregate/insert: {&quot;status&quot;&#58;&quot;active&quot;}"
  param-limit="number:optional:limit the number of records returned::10"
  >
   <!--
    <parameters select="@database" />
    <parameters select="@collection" />
    <parameters select="@action" />
    -->
    <defvar name="body"><parameters select="*"/></defvar>

    <require_module name="mongodb" var="mongo" />

  
   


    <eval name="result">
   {  let output = body;
     const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

     const query = body ? JSON.parse(body) : {};
     const client = new mongo.MongoClient(uri);
     const limitVal = typeof limit !== 'undefined' && limit !== '' ? parseInt(limit, 10) : undefined;

     try {
        await client.connect();
        const db = database ? client.db(database) : undefined;
        const col = db && collection ? db.collection(collection) : undefined;

        switch (action) {
          case 'find':
            let cursor = col.find(query);
            if (limitVal) cursor = cursor.limit(limitVal);
            output = await cursor.toArray();
            break;
          case 'count':
            output = await col.countDocuments(query);
            break;
          case 'aggregate':
            let aggCursor = col.aggregate(query);
            if (limitVal) aggCursor = aggCursor.limit(limitVal);
            output = await aggCursor.toArray();
            break;
          case 'insert':
            output = await col.insertOne(query);
            break;
          default:
           throw new Error('unknown action for MONGODB: ' + action);
        }

     } finally {
        await client.close();
     }

     return JSON.stringify(output, null, 2);
   }
    </eval>
    
    


   <output>${result}</output>
  </subroutine>
</dirac>
