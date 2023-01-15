// IMPORTS
import env from "dotenv";
env.config();
import minimist from "minimist";
import express from "express";
import mongoose from "mongoose";
import cluster from "cluster";
import os from "os";
import { loadRoutes } from "./router";

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
	const app = express();
	loadRoutes({
		app: app,
		args: args,
		NUMBEROFCORES: NUMBEROFCORES
	})
}





