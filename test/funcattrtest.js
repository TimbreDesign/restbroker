class Cls {
	hello() {
		console.log("hello");
	}
}

a=new Cls();
b=new Cls();

a.hello.test=1;
b.hello.test=2;

console.log(a.hello.test);
console.log(b.hello.test);

// Nope doesn't work...