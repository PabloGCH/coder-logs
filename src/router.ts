import express from "express";
import { Socket, Server as SocketServer} from "socket.io";
import { ProductDbManager } from "./managers/productsDbManager";
import { MessageDbManager } from "./managers/messageDbManager";
//import HttpServer from "http";
import { UserModel } from "./schemas/user";
import MongoStore from "connect-mongo";
import {engine} from "express-handlebars";
import session from "express-session";
import {fork} from "child_process";
import cookieParser from "cookie-parser";
import passport from "passport";
import passportLocal from "passport-local";
import path from "path";
import bcrypt from "bcrypt";
import compression from "compression";



export const loadRoutes = ({app, args, NUMBEROFCORES} :any) => {
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

	app.get("/", (req :any, res :any) => {
		res.redirect("/login")
	})

	app.get("/server-info", compression(), (req :any, res :any) => {
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

	app.get("/info", (req:any, res :any) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {
			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	});

	app.get("/randoms", (req:any, res :any) => {
		const randNumProcess = fork("./src/child-process/randomNumbers.ts");
		const cant = req.query.cant;
		randNumProcess.send(cant||100000000);
		randNumProcess.on("message", (data) => {
			return res.send(data);
		})
	});

	app.get("/stock", (req :any, res :any) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {
			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/form", (req :any, res :any) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {

			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/chat", (req :any, res :any) => {
		if(req.session.user == undefined){
			res.redirect("/login")
		} else {
			res.cookie("username", req.session.user.username)
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/login", (req :any, res :any) => {
		if(req.session.user){
			res.redirect("/stock")
		} else {
			res.sendFile("public/client/index.html", {root: __dirname})
		}
	})
	app.get("/register", (req :any,res :any) => {
		res.sendFile("public/client/index.html", {root: __dirname})
	});
	app.get("/logerror", (req :any, res :any) => {
		res.sendFile("public/client/index.html", {root: __dirname})
	});
	app.get("/regerror", (req :any, res :any) => {
		res.sendFile("public/client/index.html", {root: __dirname})
	});


	app.post("/register", passport.authenticate("signupStrategy", {
		failureRedirect: "/register",
		failureMessage: true
	}), (req :any, res :any) => {
		res.send({success: req.success || false, message: req.message||""})
	});

	app.post("/login", (req:any, res :any) => {
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

	app.post("/newMessage", (req :any, res :any) => {
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

	app.post("/newProduct", (req :any, res :any) => {
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
	app.get("/userData", (req :any, res :any) => {
		res.send(req.session.user.name)
	})

	app.get("/logOff", (req :any, res :any) => {
		req.logout((err :any) => {
			if(err) return res.send("failed to close session")
				req.session.destroy((err :any) => {
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
