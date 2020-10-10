const WebSocket=require("ws");
const ClientResponse=require("./ClientResponse");
const EventEmitter=require("events");

class RestBrokerClient extends EventEmitter {
	constructor(options) {
		super();

		if (!options.url || !options.handler)
			throw new Error("Need url and handler");

		this.handler=options.handler;
		this.url=options.url;
		this.delay=5000;

		this.logEnabled=false;
		this.connect();
	}

	setLogEnabled(enabled) {
		this.logEnabled=enabled;
	}

	log=(message)=>{
		if (this.logEnabled)
			console.log("** rbc: "+message);
	}

	setDelay(time) {
		this.delay=time;
	}

	reset() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout=null;
		}

		if (this.pingTimeout) {
			clearTimeout(this.pingTimeout);
			this.pingTimeout=null;
		}

		if (this.pongTimeout) {
			clearTimeout(this.pongTimeout);
			this.pongTimeout=null;
		}

		if (this.ws) {
			this.ws.onopen=null;
			this.ws.onmessage=null;
			this.ws.onclose=null;
			this.ws.onerror=null;
			this.ws.close();
			this.ws=null;
		}
	}

	isConnected() {
		if (!this.ws)
			return false;

		if (this.ws.readyState==WebSocket.OPEN)
			return true;

		return false;
	}

	connect=()=>{
		this.log("Connecting client");
		this.reset();
		this.ws=new WebSocket(this.url);
		this.ws.onopen=this.onWsOpen;
		this.ws.onmessage=this.onWsMessage;
		this.ws.onclose=this.onWsError;
		this.ws.onerror=this.onWsError;

		this.pingTimeout=setTimeout(this.onPingTimeout,this.delay);
	}

	onPingTimeout=()=>{
		this.log("Sending ping.");
		this.pingTimeout=null;
		this.ws.send(JSON.stringify({
			_: "ping"
		}));

		this.pongTimeout=setTimeout(this.onPongTimeout,this.delay);
	}

	onWsOpen=(event)=>{
		this.log("Connection open!");
		this.emit("stateChange");
	}

	onWsError=(event)=>{
		this.reset();
		this.reconnectTimeout=setTimeout(this.connect,this.delay);
		this.emit("stateChange");
	}

	onPongTimeout=()=>{
		this.log("Got no pong, will reconect...");
		this.pongTimeout=null;
		this.reset();
		this.reconnectTimeout=setTimeout(this.connect,this.delay);
		this.emit("stateChange");
	}

	onWsMessage=(event)=>{
		let message=JSON.parse(event.data);

		switch (message._) {
			case "request":
				let res=new ClientResponse(this,message.uuid);
				this.handler(message.req,res);
				break;

			case "ping":
				this.log("ping? pong!");
				this.ws.send(JSON.stringify({
					_: "pong"
				}));
				break;

			case "pong":
				this.log("Got pong!");
				clearTimeout(this.pongTimeout);
				this.pongTimeout=null;
				this.pingTimeout=setTimeout(this.onPingTimeout,this.delay);
				break;
		}
	}

	respond(res) {
		if (!this.ws)
			return;

		this.ws.send(JSON.stringify({
			_: "response",
			uuid: res.uuid,
			data: res.data
		}));
	}

	close() {
		this.reset();
	}
}

module.exports=RestBrokerClient;
