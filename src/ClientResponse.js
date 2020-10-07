class ClientResponse {
	constructor(client, uuid) {
		this.client=client;
		this.uuid=uuid;

		this.data="";
	}

	write(data) {
		this.data+=data;
	}

	end(data) {
		if (data)
			this.data+=data;

		this.client.respond(this);
	}
}

module.exports=ClientResponse;