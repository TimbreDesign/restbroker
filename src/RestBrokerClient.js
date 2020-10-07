const WebSocket=require("ws");
const ClientResponse=require("./ClientResponse");
const EventEmitter=require("events");

class RestBrokerClient extends EventEmitter {
	constructor(url, handler) {
		super();

		this.handler=handler;
		this.url=url;
		this.reconnectTime=5000;

		this.connect();
	}

	setReconnectTime(time) {
		this.reconnectTime=time;
	}

	connect=()=>{
		this.ws=new WebSocket(this.url);
		this.ws.onopen=this.onWsOpen;
		this.ws.onmessage=this.onWsMessage;
		this.ws.onclose=this.onWsError;
		this.ws.onerror=this.onWsError;
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
		this.ws.onopen=null;
		this.ws.onmessage=null;
		this.ws.onclose=null;
		this.ws.onerror=null;
		this.ws.close();
		this.ws=null;

		setTimeout(this.connect,this.reconnectTime);

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
}

module.exports=RestBrokerClient;
