const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar as variáveis de ambiente
dotenv.config();

// Criar a conexão com o banco de dados utilizando a URL ou variáveis separadas
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING, // Usa a URL completa para a conexão
  ssl: {
    rejectUnauthorized: false, // Isso permite conexões seguras sem verificação adicional
  },
});

module.exports = pool;
