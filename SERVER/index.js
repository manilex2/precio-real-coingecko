require('dotenv').config();
const express = require('express');
const app = express();
const { database } = require('./keys');
const mysql = require('mysql2');
const fetch = require('node-fetch');
const morgan = require('morgan');
const PUERTO = 4300;

app.use(morgan('dev'));

app.get('/', async (req, res) => {
    const conexion = mysql.createConnection({
        host: database.host,
        user: database.user,
        password: database.password,
        database: database.database,
        port: database.port
    });
    var sql = `SELECT name FROM ${process.env.TABLE_CRIPTOS}`;
    conexion.query(sql, async function (err, resultado) {
        if (err) throw err;
        console.log('Conexion establecida con la base de datos');
        console.log(resultado);
    });
});

app.listen(process.env.PORT || PUERTO, () => {
    console.log(`Escuchando en puerto: ${process.env.PORT || PUERTO}`);
});