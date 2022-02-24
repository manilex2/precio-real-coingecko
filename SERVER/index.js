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
    try {
        let sql = `SELECT name FROM ${process.env.TABLE_LIST_CRIPTOS}`;
        conexion.query(sql, async function (err, resultado) {
            if (err) throw err;
            console.log('Conexion establecida con la base de datos');
            await agregarPrecios(resultado);
        });
    } catch (error) {
        console.error(error)
    }
    async function agregarPrecios(resultado) {
        var cripto = [];
        for (let i = 0; i < resultado.length; i++) {
            cripto.push(resultado[i].name);
        }
        const CRIPTOSJOIN = cripto.join(',');
        await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${CRIPTOSJOIN}&vs_currencies=usd`)
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            var respuesta = json;
            evaluarDatos(respuesta);
        })
        .catch((error) => {
            console.error(error);
        });
    };
    async function evaluarDatos(respuesta) {
        var datos = [];
        var fecha = new Date();
        var mes = fecha.getMonth() + 1;
        fechaFormateada = `${fecha.getFullYear()}-${mes}-${fecha.getDate()}`;
        for (const coin in respuesta) {
            for (const precio in respuesta[coin]) {
                datos.push([coin, fechaFormateada, respuesta[coin][precio]]);
            };
        };
        let sql = `DELETE FROM ${process.env.TABLE_PRICE_CRIPTOS} WHERE fecha = '${fechaFormateada}'`;
        conexion.query(sql, async (err) => {
            if (err) throw err;
        });
        let sql2 = `ALTER TABLE ${process.env.TABLE_PRICE_CRIPTOS} AUTO_INCREMENT = 1`;
        conexion.query(sql2, async (err) => {
            if (err) throw err;
        });
        let sql3 = `INSERT INTO ${process.env.TABLE_PRICE_CRIPTOS} (name, fecha, precio) VALUES ?`;
        conexion.query(sql3, [datos], async (err, resultado) => {
            if (err) throw err;
            console.log(resultado);
            await finalizarEjecucion();
        });
        console.log(sql, sql2, sql3)
    }
    async function finalizarEjecucion() {
        conexion.end();
        res.send('Ejecutado');
    }
});

app.listen(process.env.PORT || PUERTO, () => {
    console.log(`Escuchando en puerto: ${process.env.PORT || PUERTO}`);
});