export declare class DatabaseClient {
    private axiosInstance;
    private token;
    constructor(baseURL: string);
    private getAuthHeader;
    createUser(username: string, password: string): Promise<string>;
    login(username: string, password: string): Promise<void>;
    assignUserToDatabase(dbIndex: number): Promise<string>;
    rpush(dbIndex: number, key: string, values: string[]): Promise<number>;
    lrange(dbIndex: number, key: string, start: number, stop: number): Promise<string[]>;
    lpop(dbIndex: number, key: string): Promise<string | null>;
    llen(dbIndex: number, key: string): Promise<number>;
    createSnapshot(): Promise<string>;
    set(dbIndex: number, key: string, value: string): Promise<string>;
    get(dbIndex: number, key: string): Promise<string | null>;
    incr(dbIndex: number, key: string): Promise<number>;
    sadd(dbIndex: number, key: string, members: string[]): Promise<number>;
    smembers(dbIndex: number, key: string): Promise<string[]>;
    sismember(dbIndex: number, key: string, member: string): Promise<boolean>;
    del(dbIndex: number, keys: string[]): Promise<number>;
    exists(dbIndex: number, keys: string[]): Promise<number>;
    expire(dbIndex: number, key: string, seconds: number): Promise<boolean>;
    deleteDatabase(dbIndex: number): Promise<string>;
    getDatabaseInfo(dbIndex: number): Promise<any>;
    getUserInfo(): Promise<any>;
    listDatabases(): Promise<number[]>;
    listUsers(): Promise<string[]>;
}
