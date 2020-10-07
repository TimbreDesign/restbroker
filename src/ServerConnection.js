const url=require("url");
const querystring=require("querystring");
const uuid=require("uuid");

class ServerConnection {
	constructor(ws, req) {
		let params={...querystring.parse(url.parse(req.url).query)};
		this.id=params.id;

		console.log("Creating server connection: "+this.id);

		this.ws=ws;
		this.ws.on("message",this.onWsMessage);

		this.responsesByUuid={};
	}

	onWsMessage=(message)=>{
		let data=JSON.parse(message);

		this.responsesByUuid[data.uuid].end(data.data);
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
