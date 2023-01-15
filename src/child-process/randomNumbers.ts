console.log("running child process")

const randomNum = (cant :number) => {
	let numbers :number[] = [];
	for(let i = 0; i < cant; i++) {
		numbers.push(Math.floor(Math.random() * 1000 + 1));
	}
	return numbers;
}


process.on("message", (data:string) => {
	if(process.send) {
		let cant = parseInt(data);
		process.send(randomNum(cant));
	}
})
