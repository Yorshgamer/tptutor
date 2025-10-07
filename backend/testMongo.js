const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://dev_user:WBoDvKLIekch3CxF@cluster0.lavlfm4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Conectado correctamente a MongoDB Atlas!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);