const socket = io();
const content = document.getElementById("content");
let currentUserEmail = "";
let username = "";

const getCookie = (name) => {
	let cookievalue;
	document.cookie.split(';').every(el => {
		let [key,value] = el.split('=');
		if(key == name) {
			cookievalue = value
			return false;
		}
		return true;
	})
	return cookievalue;
}
username = getCookie("username");

//HANDLEBARS HELPERS
Handlebars.registerHelper("compareStrings", (a, b, options) => {
	return a == b ? options.fn(this) : options.inverse(this);
})
//FUNCTIONS
const loginForm = async() => {
	const response = await fetch("../templates/login.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template();
	return html;
}
const serverInfo = async() => {
	let serverData = await fetch("/server-info");
	const response = await fetch("../templates/info.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template({loggedUser: username, ...await serverData.json()});
	return html;
}
const logError = async() => {
	const response = await fetch("../templates/logError.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template();
	return html;
}
const regError = async() => {
	const response = await fetch("../templates/regError.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template();
	return html;
}
const registerForm = async() => {
	const response = await fetch("../templates/register.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template();
	return html;
}
const productForm = async() => {
	const response = await fetch("../templates/form.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template({loggedUser: username});
	return html;
}

const productTable = async(data) => {
	Object.assign(data, {loggedUser: username})
	const response = await fetch("../templates/products.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template(data)
	return html;
}

const productFormSubmit = () => {
	const form = document.getElementById("product-form");
	const inputs = form.getElementsByTagName("input");
	let newProduct = {
		name: inputs[0].value,
		price: inputs[1].value,
		imgUrl: inputs[2].value
	};
	fetch("/newProduct", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(newProduct)
	})
		.then(async(res) => {
			let data = await res.json();
			if(data.success) {
				window.location.replace("stock")
			}
			if(!data.success && data.message == "not_logged") {
				window.location.replace("login")
			}
		})
}

const chatSection = async(data, user) => {
	Object.assign(data, {user: user, loggedUser: username})
	const response = await fetch("../templates/chat.handlebars");
	const result = await response.text();
	const template = Handlebars.compile(result);
	const html = template(data);
	return html;
}

//EVENTS
const sendMessage = () => {
	currentUserEmail = document.getElementById("email").value;
	let message = document.getElementById("message").value;
	let date = new Date();
	let newMessage = {
		email: currentUserEmail,
		date: date.getDate().toString() + "/" + date.getMonth().toString() + "/" + date.getFullYear().toString() + " - " + date.getHours().toString() + ":" + date.getMinutes().toString() + ":" + date.getSeconds().toString(),
		message: message
	}
	fetch("/newMessage", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(newMessage)
	})
		.then(async(res) => {
			let data = await res.json();
			if(!data.success && data.message == "not_logged") {
				window.location.replace("login")
			}
		})
}

//REGISTER EVENT
const registerSubmit = () => {
	const form = document.getElementById("reg-form");
	const inputs = form.getElementsByTagName("input");
	let regData = {
		username: inputs[0].value,
		password: inputs[1].value
	};
	fetch("/register", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(regData)
	})
		.then(async(res) => {
			let data = await res.json();
			if(data.success) {
				window.location.replace("login")
			} else {
				window.location.replace("regerror")
			}
		})
}
//LOGIN EVENT
const logSubmit = () => {
	const form = document.getElementById("log-form");
	const inputs = form.getElementsByTagName("input");
	let logData = {
		username: inputs[0].value,
		password: inputs[1].value,
	};
	fetch("/login", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(logData)
	})
		.then(async(res) => {
			let data = await res.json();
			if(data.success){
				window.location.replace("stock")
			} else {
				window.location.replace("logerror")
			}
		})
}


//ROUTES
if(window.location.pathname == "/stock") {
	socket.on("products", data => {
		productTable(data).then(res => {
			content.innerHTML = res;
		})
	})
}
if(window.location.pathname == "/form") {
	productForm().then(res => {
		content.innerHTML = res;
	})
}
if(window.location.pathname == "/login") {
	loginForm().then(res => {
		content.innerHTML = res;
	})
}
if(window.location.pathname == "/regerror") {
	regError().then(res => {
		content.innerHTML = res;
	})
}
if(window.location.pathname == "/logerror") {
	logError().then(res => {
		content.innerHTML = res;
	})
}
if(window.location.pathname == "/register") {
	registerForm().then(res => {
		content.innerHTML = res;
	})
}
if(window.location.pathname == "/info") {
	serverInfo().then(res => {
		content.innerHTML = res;
	})
}
if(window.location.pathname == "/chat") {
	socket.on("messages", data => {
		chatSection(data, currentUserEmail).then(res => {
			content.innerHTML = res;
			document.getElementById("email").value = currentUserEmail;
			let messageBox = document.getElementById("message-box");
			messageBox.scrollTop = messageBox.scrollHeight;
		})
	})
}

const logOff = () => {
	fetch("/logOff", {
		method: "GET",
		headers: {'Content-Type': 'application/json'},
	}).then(res => {
		window.location.replace("/")
	})
} 
