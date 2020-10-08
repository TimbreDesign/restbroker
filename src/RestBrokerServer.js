const http=require("http");
const WebSocket=require("ws");
const ServerConnection=require("./ServerConnection");
const url=require("url");
const EventEmitter=require("events");

class RestBrokerServer extends EventEmitter {
	constructor() {
		super();

		this.httpServer=http.createServer(this.onHttpRequest);
		this.wsServer=new WebSocket.Server({server: this.httpServer});

		this.wsServer.on('connection',this.onWsConnection)

		this.connectionsById={};
	}

	onHttpRequest=(req, res)=>{
		let u=url.parse(req.url);
		let path=u.pathname.split("/").filter(x=>x);

		if (path.length==0) {
			let response={
				devices: Object.keys(this.connectionsById)
			};

			res.end(JSON.stringify(response,null,2)+"\n");
		}

		else {
			if (!Object.keys(this.connectionsById).includes(path[0])) {
				res.end("Device not connected");
				return;
			}

			//console.log("before: "+req.url);

			let id=path[0];
			path=path.slice(1);
//			req.url="/"+path.join("/")+u.search;
			req.url="/"+path.join("/")+(u.search?u.search:"");

			//console.log("after: "+req.url);

			this.connectionsById[id].handleRequest(req,res);
		}
	}

	onWsConnection=(ws, req)=>{
		let connection=new ServerConnection(ws, req);
		if (!connection.getId()) {
			connection.close();
			return;
		}

		let id=connection.getId();
		if (this.connectionsById[id]) {
			this.connectionsById[id].off("close",this.onConnectionClose);
			this.connectionsById[id].close();
			delete this.connectionsById[id];
		}

		connection.on("close",this.onConnectionClose);
		this.connectionsById[id]=connection;

		this.emit("connectionsChange");
	}

	onConnectionClose=(connection)=>{
		connection.off("close",this.onConnectionClose);
		delete this.connectionsById[connection.getId()];

		this.emit("connectionsChange");
	}

	listen(port) {
		this.httpServer.listen(port);
	}

	close() {
		for (let id in this.connectionsById)
			this.connectionsById[id].close();

		this.httpServer.close();
	}
}

module.exports=RestBrokerServer;
