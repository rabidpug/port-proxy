import express from 'express';
import { createServer } from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer();

const router = express();

const server = createServer(router);


function getPort(req) {

	const host = req.headers.host || "";
	const index = host.indexOf(":");
	const domain = index !== -1 ? host.substring(0, index) : host;
	const parts = domain.split(".");

	return parts.shift();
}

router.all('*', (req, res, next) => {
	console.log(req.headers);
	const port = getPort(req);
	if (!port) return next();
	console.log(`Proxying web ${port}`);
	proxy.web(req, res, {
		ignorePath: true,
		target: `http://0.0.0.0:${port}${req.originalUrl || ''}`,
	}, (e) => console.error(e));
});

server.on("upgrade", (req, socket, head) => {
	console.log(req.headers);
	socket.pause();
	const port = getPort(req);
	if (!port) return socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
	console.log(`Proxying websocket ${port}`);
	proxy.ws(req, socket, head, {
		ignorePath: true,
		target: `http://0.0.0.0:${port}${req.originalUrl || ''}`,
	}, (e) => console.error(e));
});

server.listen(9999, 'localhost', () => console.log('Proxy server listening on 9999'));
server.on('error', (e) => console.error(e));
