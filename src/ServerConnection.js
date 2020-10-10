const url=require("url");
const querystring=require("querystring");
const uuid=require("uuid");
const EventEmitter=require("events");

class ServerConnection extends EventEmitter {
	constructor(server, ws, req) {
		super();

		this.server=server;

		let params={...querystring.parse(url.parse(req.url).query)};
		this.id=params.id;

		this.ws=ws;
		this.ws.on("message",this.onWsMessage);
		this.ws.on("close",this.onWsClose);

		this.responsesByUuid={};
	}

	onWsClose=()=>{
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
		}
	}

	close() {
		this.ws.close();
	}

	getId() {
		return this.id;
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
