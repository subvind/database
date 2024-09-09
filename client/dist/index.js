"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseClient = void 0;
const axios_1 = require("axios");
class DatabaseClient {
    constructor(baseURL) {
        this.token = null;
        this.axiosInstance = axios_1.default.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    getAuthHeader() {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    }
    async createUser(username, password) {
        const response = await this.axiosInstance.post('/storage/user', { username, password });
        return response.data;
    }
    async login(username, password) {
        const response = await this.axiosInstance.post('/storage/login', { username, password });
        this.token = response.data.access_token;
    }
    async assignUserToDatabase(dbIndex) {
        const response = await this.axiosInstance.post('/storage/assign-db', { dbIndex }, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async rpush(dbIndex, key, values) {
        const response = await this.axiosInstance.post(`/storage/rpush/${dbIndex}/${key}`, { values }, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async lrange(dbIndex, key, start, stop) {
        const response = await this.axiosInstance.get(`/storage/lrange/${dbIndex}/${key}`, {
            params: { start, stop },
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async lpop(dbIndex, key) {
        const response = await this.axiosInstance.post(`/storage/lpop/${dbIndex}/${key}`, {}, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async llen(dbIndex, key) {
        const response = await this.axiosInstance.get(`/storage/llen/${dbIndex}/${key}`, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async createSnapshot() {
        const response = await this.axiosInstance.post('/storage/snapshot', {}, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async set(dbIndex, key, value) {
        const response = await this.axiosInstance.post(`/storage/set/${dbIndex}/${key}`, { value }, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async get(dbIndex, key) {
        const response = await this.axiosInstance.get(`/storage/get/${dbIndex}/${key}`, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async incr(dbIndex, key) {
        const response = await this.axiosInstance.post(`/storage/incr/${dbIndex}/${key}`, {}, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async sadd(dbIndex, key, members) {
        const response = await this.axiosInstance.post(`/storage/sadd/${dbIndex}/${key}`, { members }, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async smembers(dbIndex, key) {
        const response = await this.axiosInstance.get(`/storage/smembers/${dbIndex}/${key}`, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async sismember(dbIndex, key, member) {
        const response = await this.axiosInstance.get(`/storage/sismember/${dbIndex}/${key}/${member}`, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async del(dbIndex, keys) {
        const response = await this.axiosInstance.post(`/storage/del/${dbIndex}`, { keys }, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async exists(dbIndex, keys) {
        const response = await this.axiosInstance.get(`/storage/exists/${dbIndex}`, {
            params: { keys },
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async expire(dbIndex, key, seconds) {
        const response = await this.axiosInstance.post(`/storage/expire/${dbIndex}/${key}`, { seconds }, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async deleteDatabase(dbIndex) {
        const response = await this.axiosInstance.delete(`/storage/database/${dbIndex}`, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async getDatabaseInfo(dbIndex) {
        const response = await this.axiosInstance.get(`/storage/database/${dbIndex}/info`, {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async getUserInfo() {
        const response = await this.axiosInstance.get('/storage/user/info', {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async listDatabases() {
        const response = await this.axiosInstance.get('/storage/databases', {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
    async listUsers() {
        const response = await this.axiosInstance.get('/storage/users', {
            headers: this.getAuthHeader(),
        });
        return response.data;
    }
}
exports.DatabaseClient = DatabaseClient;
//# sourceMappingURL=index.js.map