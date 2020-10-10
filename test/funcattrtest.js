class Cls {
	hello=()=>{
		console.log("hello");
	}

	world() {
		console.log("world");
	}
}

a=new Cls();
b=new Cls();

function test() {

}

console.log(test.prototype);
console.log(a.hello.prototype);
console.log(a.world.prototype);

a.hello.test=1;
b.hello.test=2;

console.log(a.hello.test);
console.log(b.hello.test);

// Nope doesn't work...