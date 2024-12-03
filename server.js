const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Rota principal
app.use('/api/resume', require('./routes/resume'));

// Configurar a porta
const PORT = process.env.PORT || 8080; // Porta padrão agora é 8080
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
