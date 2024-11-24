import express from 'express';
const app = express();
import { setupBot } from './bot.js';
import routes from './routes.js';
const PORT = process.env.PORT || 3000;
import env from 'dotenv';
env.config();

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});


setupBot();
