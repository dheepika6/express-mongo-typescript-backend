import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './library/Logging';
import authorRoutes from './routes/Author';
import bookRoutes from './routes/Book';

const router = express();

/**connect mongoose */
mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('mongoose connected!');
        startServer();
    })
    .catch((error) => {
        Logging.error('mongoose connection error');
        Logging.error(error);
    });

/** start server */

const startServer = () => {
    /** middleware usage */
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.use((req, res, next) => {
        Logging.info(
            `Incoming method [${req.method} - url ${req.url} - ipaddress - ${req.socket.remoteAddress}]`
        );

        res.on('finish', () => {
            Logging.info(
                `Incoming method [${req.method} - url ${req.url} - ipaddress - ${req.socket.remoteAddress}] - status ${res.status}`
            );
        });

        next();
    });

    /** rules of API */

    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );

        if (req.method === 'OPTIONS') {
            res.header(
                'Access-Control-Allow-Methods',
                'PUT, POST, PATCH, DELETE, GET'
            );
            return res.status(200).json({});
        }
        next();
    });

    /** Routes */

    router.use('/authors', authorRoutes);
    router.use('/books', bookRoutes);

    /** healthcheck */
    router.get('/ping', (req, res, next) => {
        return res.status(200).json({ message: 'pong' });
    });

    /** error handling */

    router.use((req, res, next) => {
        const error = new Error('not found');

        Logging.error(error);

        return res.status(404).json({ message: error.message });
    });

    http.createServer(router).listen(config.server.port, () =>
        Logging.info('server is running at port - ' + config.server.port)
    );
};
