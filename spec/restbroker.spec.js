const RestBrokerServer=require("../src/RestBrokerServer");
const RestBrokerClient=require("../src/RestBrokerClient");
const fetch=require("node-fetch");
const testutils=require("./helpers/testutils");

describe("restbroker", ()=>{
	let PORT=12345;

	it("can start a server", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let res=await fetch("http://localhost:"+PORT+"/");
		let data=JSON.parse(await res.text());
		expect(data.devices).toBeInstanceOf(Array);
		expect(data.devices.length).toBe(0);

		server.close();
	});

	it("routes calls", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let handlerSpy=jasmine.createSpy();
		function handler(req, res) {
			handlerSpy();
			res.end("hello world");
		}

		let url="ws://localhost:"+PORT+"/?id=1234";
		let client=new RestBrokerClient(url,handler);

		expect(client.isConnected()).toBe(false);
		await testutils.waitEvent(client,"stateChange");
		expect(client.isConnected()).toBe(true);

		let res=await fetch("http://localhost:"+PORT+"/");
		let data=JSON.parse(await res.text());
		expect(data.devices).toBeInstanceOf(Array);
		expect(data.devices.length).toBe(1);

		res=await (await fetch("http://localhost:"+PORT+"/1234/")).text();
		expect(res).toEqual("hello world");
		expect(handlerSpy).toHaveBeenCalled();

		server.close();
	});

	it("reconnects", async ()=>{
		function handler(req, res) {
			res.end("hello world");
		}

		let server=new RestBrokerServer();
		server.listen(PORT);

		let url="ws://localhost:"+PORT+"/?id=1234";
		let client=new RestBrokerClient(url,handler);
		client.setReconnectTime(100);

		expect(client.isConnected()).toBe(false);
		await testutils.waitEvent(client,"stateChange");
		expect(client.isConnected()).toBe(true);

		server.close();

		await testutils.waitEvent(client,"stateChange");
		expect(client.isConnected()).toBe(false);

		server=new RestBrokerServer();
		server.listen(PORT);

		await testutils.waitEvent(client,"stateChange");
		expect(client.isConnected()).toBe(true);

		server.close();
	});
});