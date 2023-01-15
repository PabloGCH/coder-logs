import path from "path"

export const sqliteconfig = {
	client: "sqlite",
	connection: {
		filename: path.join(__dirname, "../db/messagesDb.sqlite")
	}
}
