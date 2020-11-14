const url=require("url");
const querystring=require("querystring");
const uuid=require("uuid");
const EventEmitter=require("events");

class ServerConnection extends EventEmitter {
	constructor(server, ws, req) {
		super();

		this.server=server;
		//console.log(req.headers);

		let params={...querystring.parse(url.parse(req.url).query)};
		this.id=params["--X-Client-Id"];
		this.key=params["--X-Api-Key"];

		this.ws=ws;
		this.ws.on("message",this.onWsMessage);
		this.ws.on("close",this.onWsClose);

		this.responsesByUuid={};
		this.pingTimeout=setTimeout(this.onPingTimeout,this.server.delay);
	}

	onPingTimeout=()=>{
		this.server.log("sending ping");

		this.pingTimeout=null;
		this.ws.send(JSON.stringify({
			_: "ping"
		}));

		this.pongTimeout=setTimeout(this.onPongTimeout,this.server.delay);
	}

	onPongTimeout=()=>{
		this.server.log("pong timeout!");

		this.pongTimeout=null;
		this.ws.close();
		this.emit("close",this);
	}

	reset() {
		if (this.pingTimeout) {
			clearTimeout(this.pingTimeout);
			this.pingTimeout=null;
		}

		if (this.pongTimeout) {
			clearTimeout(this.pongTimeout);
			this.pongTimeout=null;
		}
	}

	onWsClose=()=>{
		this.reset();
		this.emit("close",this);
	}

	onWsMessage=(message)=>{
		let data=JSON.parse(message);

		switch (data._) {
			case "response":
				this.responsesByUuid[data.uuid].end(data.data);
				delete this.responsesByUuid[data.uuid];
				break;

			case "ping":
				this.server.log("ping? pong!");
				this.ws.send(JSON.stringify({
					_: "pong"
				}));
				break;

			case "pong":
				this.server.log("got pong");
				clearTimeout(this.pongTimeout);
				this.pongTimeout=null;
				this.pingTimeout=setTimeout(this.onPingTimeout,this.server.delay);
				break;
		}
	}

	close() {
		this.reset();
		this.ws.close();
	}

	getId() {
		return this.id;
	}

	getKey() {
		return this.key;
	}

	handleRequest(req, res) {
		let id=uuid.v4();
		this.responsesByUuid[id]=res;

		this.ws.send(JSON.stringify({
			_: "request",
			uuid: id,
			req: {
				url: req.url,
			}
		}));
	}
}

module.exports=ServerConnection;
