const RestBrokerServer=require("../src/RestBrokerServer");
const RestBrokerClient=require("../src/RestBrokerClient");
const fetch=require("node-fetch");
const testutils=require("./helpers/testutils");

describe("restbroker", ()=>{
	let PORT=12345;

	/*it("can start a server", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let res=await fetch("http://localhost:"+PORT+"/");
		let data=JSON.parse(await res.text());
		expect(data.devices).toBeInstanceOf(Array);
		expect(data.devices.length).toBe(0);

		server.close();
	});*/

	it("routes calls", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let handlerSpy=jasmine.createSpy();
		function handler(req, res) {
			handlerSpy();
			res.end("hello world");
		}

		let url="ws://localhost:"+PORT+"/?id=1234";
		let client=new RestBrokerClient({url,handler});

		expect(client.isConnected()).toBe(false);
		await testutils.waitEvent(client,"stateChange");
		expect(client.isConnected()).toBe(true);

		let res=await fetch("http://localhost:"+PORT+"/");
		let data=JSON.parse(await res.text());
		expect(data.devices).toBeInstanceOf(Array);
		expect(data.devices.length).toBe(1);

		let u="http://localhost:"+PORT+"/1234/hello/world?a=1&b=2";
		res=await (await fetch(u)).text();
		expect(res).toEqual("hello world");
		expect(handlerSpy).toHaveBeenCalled();

		server.close();
	});

	/*it("reconnects", async ()=>{
		function handler(req, res) {
			res.end("hello world");
		}

		let server=new RestBrokerServer();
		server.listen(PORT);

		let url="ws://localhost:"+PORT+"/?id=1234";
		let client=new RestBrokerClient({url,handler});
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

	it("removes clients on disconnect", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let client=new RestBrokerClient({
			url: "ws://localhost:"+PORT+"/?id=1234",
			handler: ()=>{}
		});

		await testutils.waitEvent(client,"stateChange");

		let res=await fetch("http://localhost:"+PORT+"/");
		let data=JSON.parse(await res.text());
		expect(data.devices.length).toBe(1);

		client.close();

		await testutils.waitEvent(server,"connectionsChange");

		res=await fetch("http://localhost:"+PORT+"/");
		data=JSON.parse(await res.text());
		expect(data.devices.length).toBe(0);

		server.close();
	});

	it("removes clients on same id", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let client1=new RestBrokerClient({
			url: "ws://localhost:"+PORT+"/?id=1234",
			handler: ()=>{}
		});

		let client2=new RestBrokerClient({
			url: "ws://localhost:"+PORT+"/?id=2345",
			handler: ()=>{}
		});

		await testutils.waitEvent(client1,"stateChange");
		await testutils.waitEvent(client2,"stateChange");

		expect(Object.keys(server.connectionsById).length).toEqual(2);

		let client3=new RestBrokerClient({
			url: "ws://localhost:"+PORT+"/?id=1234",
			handler: ()=>{}
		});

		await testutils.waitEvent(client3,"stateChange");

		expect(Object.keys(server.connectionsById).length).toEqual(2);

		await testutils.waitEvent(client1,"stateChange");
		expect(client1.isConnected()).toEqual(false);

		server.close();
	});*/
});