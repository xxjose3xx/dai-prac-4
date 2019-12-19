var config = {}

require('dotenv').config();

config.gae= {
  client: "mysql",
  connection: {
    socketPath: process.env.GCP_SQL_INSTANCE_CONNECTION_NAME,
    user: process.env.GCP_SQL_USER,
    password: process.env.GCP_SQL_PASSWORD,
    database: process.env.GCP_SQL_DATABASE
  },
  useNullAsDefault: true
}

// 'useNullAsDefault:true' es necesario para sqlite: http://knexjs.org/#Builder-insert;
// por consistencia, se lo ponemos al resto de gestores de bases de datos

config.heroku= {
  client: "pg",
  connection: process.env.DATABASE_URL,
  useNullAsDefault: true
}

config.localbd= {
  client: "sqlite3",
  connection: {
    filename: "./mibd.sqlite"
  },
  useNullAsDefault: true
}

config.app= {
  base: '/carrito/v1',
  maxCarritos: 500,
  maxProductos: 20
}

module.exports = config;
