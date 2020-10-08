function waitEvent(object, event) {
	return new Promise((resolve, reject)=>{
		object.once(event,resolve);
	});
}

function delay(millis) {
	return new Promise((resolve, reject)=>{
		setTimeout(resolve,millis);
	});
}

module.exports={
	waitEvent,
	delay
};
