const Client=require("../src/RestBrokerClient");

let c=new Client({
	url: "ws://localhost:8088/?id=1234",
	handler: (req, res)=>{
		res.end("hello world this is data..");
	}
});

c.setLogEnabled(true);
c.on("stateChange",()=>{
	console.log("Client conected: "+c.isConnected());
});