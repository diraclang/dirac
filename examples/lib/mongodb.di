<!-- MongoDB operations library for Dirac -->
<dirac>
  <!-- General MongoDB subroutine: supports find, aggregate, insert, count -->
  <subroutine name="MONGODB">
    <parameters select="@database" />
    <parameters select="@collection" />
    <parameters select="@action" />
    <defvar name="body"><parameters select="*"/></defvar>

    <require_module name="mongodb" var="mongo" />

    <!-- mongo is: <variable name="mongo" />
    and the dollar sign expression : ${mongo} -->
   <!-- the body is ${body} -->
   


    <eval name="result">
   {  let output = body;
     const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
     console.log("action is:", action)
     console.log('DEBUG: body content before JSON.parse:', body);
     const query = body ? JSON.parse(body) : {};
     const client = new mongo.MongoClient(uri);
 
      
     try {
        await client.connect();
        const db = database ? client.db(database) : undefined;
        const col = db && collection ? db.collection(collection) : undefined;
       
        switch (action) {
          case 'find':
            output = await col.find(query).toArray();
            break;
          case 'count':
            output = await col.countDocuments(query);
            break;
          case 'aggregate':
            output = await col.aggregate(query).toArray();
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
    
    

<!--
    <eval name="result">
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      // database, collection, action, and body are available as variables
      console.log('DEBUG: body content before JSON.parse:', body);
      const query = body ? JSON.parse(body) : {};
      const client = new mongo.MongoClient(uri);
      let output;
      try {
        await client.connect();
        const db = database ? client.db(database) : undefined;
        const col = db && collection ? db.collection(collection) : undefined;
        switch (action || 'find') {
          case 'find':
            output = await col.find(query).toArray();
            break;
          case 'aggregate':
            output = await col.aggregate(query).toArray();
            break;
          case 'insert':
            output = await col.insertOne(query);
            break;
          case 'count':
            output = await col.countDocuments(query);
            break;
          default:
            throw new Error('Unknown action for MONGODB: ' + action);
        }
      } finally {
        await client.close();
      } 
      return JSON.stringify(output, null, 2);
    </eval> -->
   <output>${result}\n</output>
  </subroutine>
</dirac>
