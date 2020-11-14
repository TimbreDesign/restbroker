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
		//server.setLogEnabled(true);
		server.listen(PORT);

		let reqs=[];
		function handler(req, res) {
			reqs.push(req);
			res.end("hello world");
		}

		let client=new RestBrokerClient(handler);
		//client.setLogEnabled(true);
		client.setId("1234");
		client.connect("ws://localhost:"+PORT);

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

		u="http://localhost:"+PORT+"/1234/hello/world";
		res=await (await fetch(u)).text();
		expect(res).toEqual("hello world");

		expect(reqs.length).toEqual(2);
		//console.log(reqs[0].url);
		//console.log(reqs[1].url);

		expect(reqs[0].url).toEqual("/hello/world?a=1&b=2");
		expect(reqs[1].url).toEqual("/hello/world");

		server.close();
	});

	it("reconnects", async ()=>{
		function handler(req, res) {
			res.end("hello world");
		}

		let server=new RestBrokerServer();
		server.listen(PORT);

		let client=new RestBrokerClient(handler);
		client.setId("1234");
		client.setDelay(100);
		client.connect("ws://localhost:"+PORT);

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

		let client=new RestBrokerClient(()=>{});
		client.setId("1234");
		client.connect("ws://localhost:"+PORT);

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

	it("removes clients with the same id", async ()=>{
		let server=new RestBrokerServer();
		server.listen(PORT);

		let client1=new RestBrokerClient(()=>{});
		client1.setId("1234");
		client1.connect("ws://localhost:"+PORT);

		let client2=new RestBrokerClient(()=>{});
		client2.setId("2345");
		client2.connect("ws://localhost:"+PORT);

		await testutils.waitEvent(client1,"stateChange");
		await testutils.waitEvent(client2,"stateChange");

		expect(Object.keys(server.connectionsById).length).toEqual(2);

		let client3=new RestBrokerClient(()=>{});
		client3.setId("1234");
		client3.connect("ws://localhost:"+PORT);

		await testutils.waitEvent(client3,"stateChange");

		expect(Object.keys(server.connectionsById).length).toEqual(2);

		await testutils.waitEvent(client1,"stateChange");
		expect(client1.isConnected()).toEqual(false);

		server.close();
	});

	it("can require a key for http requests", async ()=>{
		let server=new RestBrokerServer();
		server.setKey("qwerty");
		//server.setLogEnabled(true);
		server.listen(PORT);

		let res=await fetch("http://localhost:"+PORT+"/");
		expect(await res.text()).toEqual("Not authorized.");
		expect(res.status).toEqual(403);

		let res2=await fetch("http://localhost:"+PORT+"/",{
			headers: {
				"X-Api-Key": "qwerty"
			}
		});
		expect(res2.status).toEqual(200);
		let data=JSON.parse(await res2.text());
		expect(data.devices).toBeInstanceOf(Array);
		expect(data.devices.length).toBe(0);

		server.close();
	});

	it("can require a key client connects", async ()=>{
		let server=new RestBrokerServer();
		server.setKey("qwerty");
		//server.setLogEnabled(true);
		server.listen(PORT);

		let client1=new RestBrokerClient(()=>{});
		client1.setId("1234");
		client1.connect("ws://localhost:"+PORT);
		await testutils.waitEvent(client1,"stateChange");
		expect(Object.keys(server.connectionsById).length).toEqual(0);

		let client2=new RestBrokerClient(()=>{});
		client2.setKey("qwerty");
		client2.setId("1234");
		client2.connect("ws://localhost:"+PORT);
		await testutils.waitEvent(client1,"stateChange");
		expect(Object.keys(server.connectionsById).length).toEqual(1);

		server.close();
	});
});