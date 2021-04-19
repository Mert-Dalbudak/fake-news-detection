const net = require('net');
const EventEmitter = require('events');
const { spawn } = require('child_process');

const spacy_child = spawn('python3', [`./bin/spacy_server.py`]);

class spacy_emitter extends EventEmitter {};
const spacy_event = new spacy_emitter();

const spacy_ready_notifier = net.createServer((socket)=>{
	socket.on('data', function(data) {
		console.log(data.toString());
		if(data.toString() == "spacy ready"){
			spacy_event.emit("ready");
			socket.destroy();
		}
	});
});

const spacy_ready_host = "localhost";
const spacy_ready_port = 49152;

spacy_ready_notifier.listen(spacy_ready_port, spacy_ready_host);

/**
 * 
 * @param {String} text 
 * @returns {Promise}
 */
const query = text => new Promise((resolve, reject) => {
	let client = new net.Socket();
	client.connect(15555, '127.0.0.1', function() {
		console.log('Connected');
		client.write(text);
	});
	client.on('data', function(data) {
		data = JSON.parse(data.toString());
		resolve(data);
		client.destroy(); // kill client after server's response
	});
	
	client.on('error', function(error) {
		reject(error);
	});
});

spacy_child.on('close', (code, signal) => {
	console.log(`child process terminated due to receipt of code: ${code}, signal: ${signal}`);
});

spacy_child.on('data', (data) => {
	console.log(`Data: ${data}`);
});

spacy_child.on('error', (err) => {
	console.error('Failed to start subprocess.');
	console.error(err);
});

module.exports = {
	kill: (signal) => {
		if(spacy_child.kill(signal))
			spacy_event.emit('killed');
	},
	on: (...args) => spacy_event.on(...args),
	query: query
};