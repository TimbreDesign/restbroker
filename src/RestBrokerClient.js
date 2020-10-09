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
		this.reconnectTime=5000;

		this.connect();
	}

	setReconnectTime(time) {
		this.reconnectTime=time;
	}

	connect=()=>{
		this.reset();
		this.ws=new WebSocket(this.url);
		this.ws.onopen=this.onWsOpen;
		this.ws.onmessage=this.onWsMessage;
		this.ws.onclose=this.onWsError;
		this.ws.onerror=this.onWsError;
	}

	reset() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout=null;
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

	onWsOpen=(event)=>{
		this.emit("stateChange");
	}

	onWsError=(event)=>{
		this.reset();
		this.reconnectTimeout=setTimeout(this.connect,this.reconnectTime);
		this.emit("stateChange");
	}

	onWsMessage=(event)=>{
		let message=JSON.parse(event.data);

		switch (message._) {
			case "request":
				let res=new ClientResponse(this,message.uuid);
				this.handler(message.req,res);
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
