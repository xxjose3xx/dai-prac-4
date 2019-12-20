'use strict';

const express = require('express');
const path = require('path');
const config = require('./config.js');

const app = express();
const PORT = process.env.PORT || 5000;
const publico = path.join(__dirname, 'public');

var knex = null;

// asume que el cuerpo del mensaje de la petición está en JSON:
app.use(express.json());

// especifica donde apuntar si no se pide ningún resurso:
app.use('/', express.static(publico));

// middleware para aceptar caracteres UTF-8 en la URL:
app.use((req, res, next) => {
  req.url = decodeURI(req.url);
  next();
});

// middleware de conexión con base de datos y creación de esquemas:
app.use(async (req, res, next) => {
  app.locals.knex = conectaBD(app.locals.knex);
  await creaEsquema(res);
  next();
});

// middleware para las cabeceras de CORS:
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods',
    'DELETE, PUT, GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'content-type');
  next();
});

// inicializa Knex.js para usar diferentes bases de datos según el entorno:
function conectaBD() {
  if (knex === null) {
    var options;
    if (process.env.CARRITO_ENV === 'gae') {
      options = config.gae;
      console.log(
        'Usando Cloud SQL (MySQL) como base de datos en Google App Engine'
      );
    } else if (process.env.CARRITO_ENV === 'heroku') {
      options = config.heroku;
      console.log('Usando PostgreSQL como base de datos en Heroku');
    } else {
      options = config.localbd;
      console.log('Usando SQLite como base de datos local');
    }
    // Muestra la conversión a SQL de cada consulta:
    // options.debug= true;
    knex = require('knex')(options);
  }
}

// crea las tablas si no existen:
async function creaEsquema(res) {
  try {
    let existeTabla = await knex.schema.hasTable('temas');
    if (!existeTabla) {
      await knex.schema.createTable('temas', (tabla) => {
        tabla.increments('temaId').primary();
        tabla.string('tema', 30).unique().notNullable();
      });
      console.log('Se ha creado la tabla temas');
    }
    existeTabla = await knex.schema.hasTable('preguntas');
    if (!existeTabla) {
      await knex.schema.createTable('preguntas', (tabla) => {
        tabla.increments('preguntaId').primary();
        tabla.string('pregunta', 200).notNullable();
        tabla.string('respuesta', 1).notNullable();
        tabla.integer('temaId').references('temaId')
          .inTable('temas').notNullable().onDelete(
            'cascade').onUpdate('cascade');
      });
      console.log('Se ha creado la tabla preguntas');
    }
  } catch (error) {
    console.log(`Error al crear las tablas: ${error}`);
    res.status(404).send({
      result: null,
      error: 'error al crear la tabla; contacta con el administrador'
    });
  }
}


//******************************************************************************
//******************************************************************************


// crea un tema:
app.post(`${config.app.base}/createma`, async (req, res) => {
  if (!req.body.tema) {
    res.status(404).send({
      result: null,
      error: 'Datos mal formados'
    });
    return;
  }
  try {
    let id = await knex('temas').insert({
      tema: req.body.tema
    });
    res.status(200).send({
      result: id[0],
      error: null
    });
  } catch (error) {
    console.log(`No se puede crear el tema: ${error}`);
    res.status(404).send({
      result: null,
      error: 'No se pudo crear el tema'
    });
  }
});

// consulta los temas creados:
app.get(`${config.app.base}/temas`, async (req, res) => {
  try {
    let temas = await knex('temas').select(['temaId', 'tema']);
    res.status(200).send({
      result: temas,
      error: null
    });
  } catch (error) {
    console.log(`No se pueden recuperar los temas: ${error}`);
    res.status(404).send({
      result: null,
      error: 'No se pueden recuperar los temas'
    });
  }
});

// borrar un tema:
app.delete(`${config.app.base}/tema/:temaId`, async (req, res) => {
  try {
    await knex('temas').where('temaId', req.params.temaId)
      .del();
    res.status(200).send({
      result: 'Borrado con éxito',
      error: null
    });
  } catch (error) {
    console.log(`No se puede borrar el tema: ${error}`);
    res.status(404).send({
      result: null,
      error: 'No se ha podido borrar el tema'
    });
  }
});

// añadir pregunta y respuesta a tema:
app.post(`${config.app.base}/tema/:temaId/creapregunta`, async (req, res) => {
  if (!req.body.pregunta || !req.body.respuesta) {
    res.status(404).send({
      result: null,
      error: 'Datos mal formados'
    });
    return;
  }
  try {
    let tema = await knex('temas').select('temaId').where(
      'temaId', req.params.temaId);
    if (tema.length != 1) {
      res.status(404).send({
        result: null,
        error: 'No existe el tema'
      });
      return;
    }
    let id = await knex('preguntas').insert({
      pregunta: req.body.pregunta,
      respuesta: req.body.respuesta,
      temaId: req.params.temaId
    });
    res.status(200).send({
      result: id[0],
      error: null
    });
  } catch (error) {
    console.log(`No se puede crear la pregunta: ${error}`);
    res.status(404).send({
      result: null,
      error: 'No se ha podido crear la pregunta'
    });
  }
});

// consulta las preguntas de un tema:
app.get(`${config.app.base}/tema/:temaId/preguntas`, async (req, res) => {
  try {
    let tema = await knex('preguntas').select('preguntaId',
      'pregunta', 'respuesta').where('temaId', req.params
      .temaId);
    res.status(200).send({
      result: tema,
      error: null
    });
  } catch (error) {
    console.log(
      `No se pueden recuperar las preguntas: ${error}`);
    res.status(404).send({
      result: null,
      error: 'No se han podido recuperar las preguntas'
    });
  }
});

// borrar una pregunta:
app.delete(`${config.app.base}/pregunta/:preguntaId`, async (req, res) => {
  try {
    await knex('preguntas').where('preguntaId', req.params
      .preguntaId).del();
    res.status(200).send({
      result: 'Borrado con éxito',
      error: null
    });
  } catch (error) {
    console.log(`No se puede borrar la pregunta: ${error}`);
    res.status(404).send({
      result: null,
      error: 'No se ha podido borrar la pregunta'
    });
  }
});


//******************************************************************************
//******************************************************************************

app.listen(PORT, function() {
  console.log(`Aplicación lanzada en el puerto ${PORT}!`);
});