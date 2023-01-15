//BASE DE DATOS
import knex, { Knex } from "knex";
import {sqloptions} from "../options/mysqlconfig";
import {sqliteconfig} from "../options/sqliteconfig";

export class DbManager {
	private tableName:string;
	private database :Knex;

	constructor(tableName :string) {
		this.tableName = tableName;
		switch(tableName) {
			case "products":
				this.database = knex(sqliteconfig);
				this.createTable();
			break;
			case "messages":
				this.database = knex(sqliteconfig);
				this.createTable();
			break;
			default:
				throw "DbManager was constructed with invalid table name"
		}
	}

	createTable() {
		this.database.schema.hasTable(this.tableName).then(exists => {
			if(!exists) {
				switch(this.tableName) {
					case "products":
						this.database.schema.createTable(this.tableName, table => {
							table.increments("id");
							table.string("name", 20);
							table.integer("price").nullable();
							table.string("imgUrl", 1500);
						})
						.then(() => console.log(`${this.tableName} table created`))
						break;
					case "messages":
						this.database.schema.createTable(this.tableName, table => {
							table.string("email", 40);
							table.string("date", 70);
							table.string("message", 500);
						})
						.then(() => console.log(`${this.tableName} table created`))
						break;
				}
			}
		})
		.catch(err => console.log(err))
	}

	addObject(object :any) {
		return new Promise((resolve, reject) => {
			this.database(this.tableName).insert(object)
			.catch((err) => reject({response: err, success: false}))
			.finally(() => resolve({response: "object added", success: true}));	
		})

	}
	rmObject(id :any) {
		return new Promise((resolve, reject) => {
			this.database.from(this.tableName).where("id", id).del()
			.catch((err) => reject({response: err, success: false}))
			.finally(() => {
				resolve({response: "Object deleted", success: true});
			});
		});
	}
	editObject(id :number, object :any) {
		return new Promise((resolve, reject) => {
			this.database.from(this.tableName).where("id", id).update(object)
			.catch((err :any) => reject({response: err, success: false}))
			.finally(() => {
				resolve({response: "Object updated", success: true});
			});
		});
	}
	getObject(id:number) {
		return new Promise((resolve, reject) => {
			let objects:any;
			this.database.from(this.tableName).select("*").where("id", id)
			.then((result) => {
				result.forEach(el => {
					objects.push({...el})
				})
			})
			.catch((err) => reject({response: err, success: false}))
			.finally(() => {
				let object = objects[0]
				resolve({response: object, success: true});
			});
		});
	}
	getObjects(){
		return new Promise((resolve, reject) => {
			const objects :any[] = [];
			this.database.from(this.tableName).select("*")
			.then((result) => {
				result.forEach(el => {
					objects.push({...el})
				})
			})
			.catch((err) => reject({response: err, success: false}))
			.finally(() => {
				resolve({response: objects, success: true});
			})
		})
	}
}

