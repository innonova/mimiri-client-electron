const { app } = require('electron');
const { AsyncDatabase } = require('promised-sqlite3');
const { rename, copyFile, mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { pathInfo } = require('./path-info');

class OfflineManager {
	constructor() {
		this.isTest = false;
		this.createDatabase();
	}

	async setTestId(testId) {
		this.isTest = true;
		this.testId = testId;
		const dir = path.join(tests, testId);
		this.connectionString = path.join(dir, 'offline.db');
		try {
			await mkdir(dir);
		} catch { }
		this.createDatabase();
		return true
	}

	async tearDown(keepLogs) {
		const testParts = this.testId.split('-');
		const newPath = path.join(tests, `${testParts[testParts.length - 1]}-last-run.offline.db`);
		if (keepLogs) {
			await copyFile(this.connectionString, newPath);
		} else {
			await rename(this.connectionString, newPath);
		}
		return true
	}

	async createDatabase(drop) {
		try {
			if (!this.connectionString) {
				try {
					await mkdir(pathInfo.database);
				} catch { }
				this.connectionString = path.join(pathInfo.database, 'offline.db');
			}
		} catch (ex) {
			console.log(ex);
		}
		var db = await AsyncDatabase.open(this.connectionString);
		try {
			if (drop) {
				await db.run('DROP TABLE IF EXISTS mimer_user;');
				await db.run('DROP TABLE IF EXISTS mimer_key_v2;');
				await db.run('DROP TABLE IF EXISTS mimer_note;');
				command.ExecuteNonQuery();
			}
			await db.run(`
				CREATE TABLE IF NOT EXISTS mimer_user (
					id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
					username TEXT NOT NULL UNIQUE,
					data TEXT NOT NULL,
					pre_login TEXT NOT NULL
				);
			`);
			await db.run('DROP TABLE IF EXISTS mimer_key;');
			await db.run(`
				CREATE TABLE IF NOT EXISTS mimer_key_v2 (
					id TEXT NOT NULL PRIMARY KEY,
					user_id TEXT NOT NULL,
					data TEXT NOT NULL
				);
			`);
			await db.run(`
				CREATE TABLE IF NOT EXISTS mimer_note (
					id TEXT NOT NULL PRIMARY KEY,
					data TEXT NOT NULL
				);
			`);
		} catch (ex) {
			console.log(ex);
		} finally {
			await db.close();
		}
	}

	async getUser(username) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			const row = await db.get('SELECT data FROM mimer_user WHERE username = $username', {
				$username: username,
			})
			if (row) {
				return JSON.parse(row.data)
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async getPreLogin(username) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			const row = await db.get('SELECT pre_login FROM mimer_user WHERE username = $username', {
				$username: username,
			})
			if (row) {
				return JSON.parse(row.pre_login)
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async setUser(username, data, preLogin) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);

			const row = await db.get('SELECT data, pre_login FROM mimer_user WHERE username = $username', {
				$username: username,
			})
			if (row && JSON.stringify(data) === row.data && JSON.stringify(preLogin) === row.pre_login) {
				return;
			}

			const runResult = await db.run('UPDATE mimer_user SET data = $data, pre_login = $pre_login WHERE username = $username', {
				$data: JSON.stringify(data),
				$pre_login: JSON.stringify(preLogin),
				$username: username,
			})
			if (runResult.changes === 0) {
				await db.run('INSERT INTO mimer_user (username, data, pre_login) VALUES ($username, $data, $pre_login)', {
					$username: username,
					$data: JSON.stringify(data),
					$pre_login: JSON.stringify(preLogin),
				})
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async deleteUser(username) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			await db.run('DELETE FROM mimer_user WHERE username = $username', {
				$username: username,
			})
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async setUserData(username, data) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);

			const row = await db.get('SELECT data FROM mimer_user WHERE username = $username', {
				$username: username,
			})
			if (row) {
				const user = JSON.parse(row.data);
				user.data = data
				await db.run('UPDATE mimer_user SET data = $data WHERE username = $username', {
					$data: JSON.stringify(user),
					$username: username
				});
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async getKey(userId, id) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			const row = await db.get('SELECT data FROM mimer_key_v2 WHERE user_id = $user_id AND id = $id', {
				$user_id: userId,
				$id: id,
			})
			if (row) {
				return JSON.parse(row.data)
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async getAllKeys(userId) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			const rows = await db.all('SELECT data FROM mimer_key_v2 WHERE user_id = $user_id', {
				$user_id: userId,
			})
			if (rows) {
				const result = { keys: [] };
				for (const row of rows) {
					result.keys.push(JSON.parse(row.data))
				}
				return result;
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async setKey(userId, id, data) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);

			const row = await db.get('SELECT data FROM mimer_key_v2 WHERE user_id = $user_id AND id = $id', {
				$user_id: userId,
				$id: id,
			})
			if (row && JSON.stringify(data) === row.data) {
				return;
			}

			const runResult = await db.run('UPDATE mimer_key_v2 SET data = $data WHERE user_id = $user_id AND id = $id', {
				$data: JSON.stringify(data),
				$user_id: userId,
				$id: id,
			})
			if (runResult.changes === 0) {
				await db.run('INSERT INTO mimer_key_v2 (id, user_id, data) VALUES ($id, $user_id, $data)', {
					$id: id,
					$user_id: userId,
					$data: JSON.stringify(data),
				})
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async deleteKey(id) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			await db.run('DELETE FROM mimer_key_v2 WHERE id = $id', {
				$id: id,
			})
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async GetNote(id) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			const row = await db.get('SELECT data FROM mimer_note WHERE id = $id', {
				$id: id,
			})
			if (row) {
				return JSON.parse(row.data)
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async setNote(id, data) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);

			const row = await db.get('SELECT data FROM mimer_note WHERE id = $id', {
				$id: id,
			})
			if (row && JSON.stringify(data) === row.data) {
				return;
			}

			const runResult = await db.run('UPDATE mimer_note SET data = $data WHERE id = $id', {
				$data: JSON.stringify(data),
				$id: id,
			})
			if (runResult.changes === 0) {
				await db.run('INSERT INTO mimer_note (id, data) VALUES ($id, $data)', {
					$id: id,
					$data: JSON.stringify(data),
				})
			}
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}

	async deleteNote(id) {
		try {
			var db = await AsyncDatabase.open(this.connectionString);
			await db.run('DELETE FROM mimer_note WHERE id = $id', {
				$id: id,
			})
		} catch (ex) {
			console.log(this.isTest, this.connectionString, ex);
		} finally {
			await db.close();
		}
		return undefined;
	}


}


module.exports = {
	OfflineManager
}