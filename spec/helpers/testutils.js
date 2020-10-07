function waitEvent(object, event) {
	return new Promise((resolve, reject)=>{
		object.once(event,resolve);
	});
}

module.exports={
	waitEvent
};
