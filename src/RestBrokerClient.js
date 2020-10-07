const WebSocket=require("ws");
const ClientResponse=require("./ClientResponse");

class RestBrokerClient {
	constructor(url, handler) {
		this.ws=new WebSocket(url);
		this.handler=handler;

		this.ws.onopen=()=>{
			console.log("open..");
		}

		this.ws.onmessage=this.onWsMessage;
	}

	onWsMessage=(event)=>{
		let message=JSON.parse(event.data);

		console.log(message);

		switch (message._) {
			case "request":
				let res=new ClientResponse(this,message.uuid);
				this.handler(message.req,res);
				break;
		}
	}

	respond(res) {
		this.ws.send(JSON.stringify({
			_: "response",
			uuid: res.uuid,
			data: res.data
		}));
	}
}

module.exports=RestBrokerClient;
