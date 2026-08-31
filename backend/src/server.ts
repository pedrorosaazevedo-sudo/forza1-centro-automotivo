import express from 'express';
import cors from 'cors';
import routes from './routes';
import { config } from './config';

const app = express();

app.use(cors());
app.use(express.json());

// Routes API
app.use('/api', routes);

// Root healthcheck
app.get('/', (req, res) => {
  res.json({
    app: 'Lemoka Centro Automotivo API',
    status: 'online',
    version: '1.0.0'
  });
});

app.listen(config.port, () => {
  console.log(`⚡ API Lemoka Centro Automotivo rodando na porta ${config.port}`);
});
