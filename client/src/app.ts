import express from 'express';
const app = express();


app.use(express.static("public"));


const port = process.env.CLIENT_PORT || 4000;

app.listen(port, () => {
    console.log(`Server running... `);
  });
