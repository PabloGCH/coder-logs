import fs from "fs";
import { DbManager } from "../scripts/dbScripts";

//const DbManager = require("../scripts/dbScripts");


export class MessageDbManager {
	private fileDir :string;
	private dbManager :DbManager;

	constructor(fileDir :string) {
		this.fileDir = fileDir;
		this.dbManager = new DbManager("messages");
	}

	async getAll() {
		//let file = await this.readFile();
		let answer :any = await this.dbManager.getObjects()
		if(answer.success) {
			return answer.response
		} else {
			throw answer.response
		}
	}

	async save(object :any) {
		let newObject = {
			email: object.email,
			date: object.date,
			message: object.message
		};
		if(newObject.message && newObject.email) {
			this.dbManager.addObject(newObject);
			return newObject;
		} else {
			throw "The message was empty";
		}
	}
}

