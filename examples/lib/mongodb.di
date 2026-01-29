<!-- MongoDB operations library for Dirac -->
<dirac>
  <!-- General MongoDB subroutine: supports find, aggregate, insert, count -->
  <subroutine name="MONGODB">
    <parameters select="@database" />
    <parameters select="@collection" />
    <parameters select="@action" />
    <defvar name="body"><parameters select="*"/></defvar>

    <require_module name="mongodb" var="mongo" />

  
   


    <eval name="result">
   {  let output = body;
     const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

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
    
    


   <output>${result}</output>
  </subroutine>
</dirac>
