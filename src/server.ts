// IMPORTS
import env from "dotenv";
env.config();
import minimist from "minimist";
import express, { Request } from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import passport from "passport";
import passportLocal from "passport-local";
import path from "path";
import bcrypt from "bcrypt";
import { Socket, Server as SocketServer} from "socket.io";
//import HttpServer from "http";
import { Server as HttpServer} from "http";
import { ProductDbManager } from "./managers/productsDbManager";
import { MessageDbManager } from "./managers/messageDbManager";
import { UserModel } from "./schemas/user";
import MongoStore from "connect-mongo";
import {engine} from "express-handlebars";
import session from "express-session";
import {fork} from "child_process";
import cluster from "cluster";
import os from "os";

const NUMBEROFCORES = os.cpus().length;
const options = {default: {p: 8080, m: "FORK"}, alias:{p:"puerto", m:"mode"}};
const args = minimist(process.argv.slice(2), options);



//GLOBAL VARIABLES
mongoose.connect(process.env.MONGODB_URL||"").then(
	() => {
		console.log("connection successful")
	},
	err => {
		console.log(err)
	}
)


if(args.m.toUpperCase() == "CLUSTER" && cluster.isPrimary) {
	console.log("Server initialized on cluster mode");
	for(let i = 0; i < NUMBEROFCORES; i++) {
		cluster.fork();
	}
	cluster.on("exit", (worker, error) => {
		//RE RUN SUB PROCESS ON FAILURE
		cluster.fork();
	})
} else {
	if(args.m.toUpperCase() == "FORK") {console.log("Server initialized on fork mode")}
	const app= express();
	app.use(express.json());
	app.use(express.urlencoded({extended: true}));
	app.use(express.static(path.join(__dirname, 'public')));

	const server = app.listen(args.p, ()=>{console.log(`server listening on port ${args.p}`)});
	const io = new SocketServer(server)
	const TEMPLATEFOLDER = path.join(__dirname, "public/templates");
	const container = new ProductDbManager("products.json");
	const messageManager = new MessageDbManager("message-history.json");
	app.engine("handlebars", engine())
	app.set("views", TEMPLATEFOLDER)
	app.set("view engine", "handlebars")
	const createHash = (password :string) => {
		const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
		return hash;
	}
	//APP INIT CONF
	app.use(cookieParser());
	app.use(session({
		store: MongoStore.create({mongoUrl: process.env.MONGODB_URL}),
		secret: "dfvartg4wfqR3EFRQ3",
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 10 // 1 segundo * 60 * 10 = 10 minutos
		}
	}))
	//PASSPORT CONFIGURATION
	app.use(passport.initialize());
	app.use(passport.session());
	passport.serializeUser((user :any,done)=>{
		done(null,user.id);
	})
	passport.deserializeUser((id, done)=>{
		UserModel.findById(id, (err:any, userFound :any) => {
			if(err) return done(err);
			return done(null, userFound);
		})
	})

	//REGISTER
	passport.use("signupStrategy", new passportLocal.Strategy(
		{
			passReqToCallback: true,
		},
		(req, username, password, done) => {
			UserModel.findOne({username: username}, (err:any, userFound:any) => {
				if(err) return done(err);
				if(userFound) {
					Object.assign(req, {success: false,message: "user already exists"})
					return done(null, userFound);
				}
				const newUser = {
					username: username,
					password: createHash(password)
				}
				UserModel.create(newUser, (err, userCreated) => {
					if(err) return done(err, null, {message: "failed to register user"});
					Object.assign(req, {success: true,message: "User created"})
					return done(null, userCreated)
				})
			})
		}
	));

	app.get("/", (req,res) => {
		res.redirect("/login")
	})

	app.get("/server-info", (req:any, res) => {
		if(process.send) {
			process.send(process.pid);
		}
		const serverData = {
			os: process.platform,
			vnode: process.versions.node,
			rrs: process.memoryUsage.rss(),
			pid: process.pid,
			args: process.argv.slice(2).toString(),
			execPath: process.execPath,
			projectPath: process.env.PWD,
			cores: NUMBEROFCORES
		}
		res.send(serverData);
	})

	app.get("/info", (req:any, res) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {
			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	});

	app.get("/randoms", (req, res) => {
		const randNumProcess = fork("./src/child-process/randomNumbers.ts");
		const cant = req.query.cant;
		randNumProcess.send(cant||100000000);
		randNumProcess.on("message", (data) => {
			return res.send(data);
		})
	});

	app.get("/stock", (req :any, res) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {
			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/form", (req :any, res) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {

			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/chat", (req :any, res) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {
			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/login", (req :any,res) => {
		if(req.session.user){
			res.redirect("/stock")
		} else {
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/register", (req,res) => {
		res.sendFile("public/client/index.html", {root: __dirname})
	});
	app.get("/logerror", (req,res) => {
		res.sendFile("public/client/index.html", {root: __dirname})
	});
	app.get("/regerror", (req,res) => {
		res.sendFile("public/client/index.html", {root: __dirname})
	});


	app.post("/register", passport.authenticate("signupStrategy", {
		failureRedirect: "/register",
		failureMessage: true
	}), (req:any,res) => {
		res.send({success: req.success || false, message: req.message||""})
	});

	app.post("/login", (req:any, res) => {
		const body = req.body;
		if(req.session.user) {
			res.send({message:"already logged"})
		} else if(body.username && body.password) {
			UserModel.findOne({username: body.username}, (err:any, userFound:any) => {
				if(err) {
					res.send(err)
				}
				if(userFound) {
					if(bcrypt.compareSync(body.password, userFound.password)) {
						req.session.user = {
							username: body.username,
							password: body.password
						}
						res.send({success: true, message: "Session initialized"})
					} else {
						res.send({success: false, message: "Invalid password"})
					}
				}
			})

		} else {
			res.send({success: false, message: "Invalid user inputs"})
		}
	})

	app.post("/newMessage", (req :any,res) => {
		if(req.session.user == undefined){
			res.send({success: false, message: "not_logged"})
		} else {
			messageManager.save(req.body).then(() => {
				messageManager.getAll().then(messages => {
					io.sockets.emit("messages", {messages: messages})
					res.send({success: true})
				})
			})
		}
	});

	app.post("/newProduct", (req :any,res) => {
		if(req.session.user == undefined){
			res.send({success: false, message: "not_logged"})
		} else {
			console.log("logged")
			let product = req.body;
			Object.assign(product, {price: parseInt(product.price)});
			container.save(product).then(() => {
				container.getAll().then(products => {
					io.sockets.emit("products", {products: products})
					res.send({success: true})
				})
			})
		}

	});
	app.get("/userData", (req :any, res) => {
		res.send(req.session.user.name)
	})

	app.get("/logOff", (req, res) => {
		req.logout(err => {
			if(err) return res.send("failed to close session")
				req.session.destroy((err) => {
					console.log(err);
				});
				res.redirect("/")
		})
	})


	//WEBSOCKETS
	io.on("connection", (socket :Socket) => {
		container.getAll().then(products => {
			socket.emit("products", {products: products})
		})
		messageManager.getAll().then(messages => {
			socket.emit("messages", {messages: messages})
		})
	})

}








