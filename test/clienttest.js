const Client=require("../src/RestBrokerClient");

let url="ws://localhost:8088/?id=1234"
let c=new Client(url,(req, res)=>{
	res.end("hello world this is data..");
});