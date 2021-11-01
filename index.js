import express from 'express';
import { createServer } from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer();

function getPort(req) {

	const host = req.headers.host || "";
	const idx = host.indexOf(":");
	const domain = idx !== -1 ? host.substring(0, idx) : host;
	const parts = domain.split(".");

	return parts.shift();
}
const webRouter = express();
webRouter.all('*', (req, res, next) => {
	const port = getPort(req);
	if (!port) return next();
	console.log(`Proxying web ${port}`);
	proxy.web(req, res, {
		ignorePath: true,
		target: `http://0.0.0.0:${port}${req.originalUrl || ''}`,
	}, (e) => console.error(e));
});

const server = createServer(webRouter);
server.listen(9999,'localhost',() => console.log('Proxy server listening on 9999'));
server.on('error', (e) => console.error(e));

server.on("upgrade", (req, socket, head) => {
	socket.pause();
	const port = getPort(req);
	if (!port) return socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
	console.log(`Proxying websocket ${port}`);
	proxy.ws(req, socket, head, {
		ignorePath: true,
		target: `http://0.0.0.0:${port}${req.originalUrl || ''}`,
	}, (e) => console.error(e));
});
