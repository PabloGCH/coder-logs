import fs from "fs";
import { DbManager } from "../scripts/dbScripts";

export class ProductDbManager {
	private fileDir :string;
	private dbManager :DbManager;
	constructor(fileDir:string) {
		this.fileDir = fileDir;
		this.dbManager = new DbManager("products");
	}
	async save(object :any) {
		let newObject :any = {};
		if(!object.name || !object.price) {
			throw "Didn't provide proper name and price"
		} else {
			if(typeof(object.name) == "string") {
				newObject.name = object.name;
			} else {
				throw "Name must be a string";
			}
			if(typeof(object.price) == "number") {
				newObject.price = object.price;
			} else {
				throw "Price must be a number";
			}
			newObject.imgUrl = object.imgUrl;
			await this.dbManager.addObject(newObject).then(res =>{})
		}
		return newObject;
	}
	/*
	   async getById(id) {
	   try {
	   let file = await this.readFile();
	   return file.products.find(product => product.id == id) || null;
	   }
	   catch {
	   console.log("Failed to find object")
	   }
	   }
	   */
	async getAll() {
		//let file = await this.readFile();
		let answer :any = await this.dbManager.getObjects()
		if(answer.success) {
			return answer.response
		} else {
			throw answer.response
		}
	}
	/*
	   async deleteById(id) {
	   try {
	   let file = await this.readFile();
	   let index = file.products.findIndex(product => product.id == id);
	   if(index == -1) {
	   return {success: false};
	   } else {
	   file.products.splice(index, 1)
	   this.writeFile(file);
	   return {success: true};
	   }
	   }
	   catch {
	   return {success: false};
	   }
	   }
	   async edit(object, id) {
	   try {
	   let file = await this.readFile();
	   let index = file.products.findIndex(product => product.id == id);
	   if(index != -1) {
	   Object.assign(file.products[index], object)
	   this.writeFile(file);
	   return file.products[index];
	   } else {
	   throw "Product ID invalid";
	   }
	   } 
	   catch(err) {
	   if(err) {
	   return err;
	   } else {
	   return "Failed to modify product";
	   }
	   }
	   }
	   */
}

