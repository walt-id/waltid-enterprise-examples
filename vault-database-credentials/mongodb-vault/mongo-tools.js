const fs = require("fs");

function secret(name) {
    return fs.readFileSync("/run/secrets/" + name, "utf8").trim();
}

function connectAs(user, password) {
    const credentials = encodeURIComponent(user) + ":" + encodeURIComponent(password);
    const uri = "mongodb://" + credentials + "@mongo:27017/admin?directConnection=true&serverSelectionTimeoutMS=4000";
    return new Mongo(uri).getDB("admin");
}

function bootstrap(admin) {
    try {
        admin.runCommand({ replSetGetStatus: 1 });
    } catch (error) {
        if (error.code !== 94) throw error; // NotYetInitialized
        admin.runCommand({
            replSetInitiate: { _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] },
        });
    }

    const deadline = Date.now() + 30_000;
    while (!admin.hello().isWritablePrimary) {
        if (Date.now() >= deadline) throw new Error("Replica set has no primary");
        sleep(500);
    }

    const dbName = "waltid-enterprise";
    if (!admin.getRole("vaultDemoUserManager")) {
        admin.createRole({
            role: "vaultDemoUserManager",
            privileges: [
                { resource: { db: "admin", collection: "" }, actions: ["createUser", "dropUser", "changePassword"] },
                { resource: { db: dbName, collection: "" }, actions: ["grantRole"] },
            ],
            roles: [],
        });
    }
    if (!admin.getUser("vault_demo_manager")) {
        admin.createUser({
            user: "vault_demo_manager",
            pwd: secret("vault-db-password"),
            roles: [{ role: "vaultDemoUserManager", db: "admin" }],
        });
    }
    if (process.env.DEMO_MODE === "static" && !admin.getUser("waltid_static")) {
        admin.createUser({
            user: "waltid_static",
            pwd: secret("mongo-static-password"),
            roles: [{ role: "readWrite", db: dbName }],
        });
    }
    print("Authenticated MongoDB replica set and Vault database account are ready.");
}

try {
    const operation = process.env.DEMO_MONGO_ACTION;
    if (operation === "static-login") {
        const password = fs.readFileSync(0, "utf8").trim();
        try {
            connectAs("waltid_static", password).runCommand({ ping: 1 });
            print("authenticated");
        } catch (error) {
            if (error.code !== 18) throw error; // AuthenticationFailed
            print("rejected");
        }
    } else {
        const admin = connectAs("demo_mongo_admin", secret("mongo-admin-password"));
        switch (operation) {
            case "bootstrap":
                bootstrap(admin);
                break;
            case "user-exists":
                print(admin.getUser(process.env.DEMO_MONGO_USER) !== null);
                break;
            case "list-vault-users":
                print(JSON.stringify(admin.runCommand({ usersInfo: 1 }).users
                    .map((account) => account.user).filter((user) => user.startsWith("v-"))));
                break;
            case "count-organizations":
                print(admin.getSiblingDB("waltid-enterprise").organizations.countDocuments({
                    _id: { $in: [process.env.DEMO_ORG_BEFORE, process.env.DEMO_ORG_AFTER] },
                }));
                break;
            default:
                throw new Error("Unsupported MongoDB demo operation");
        }
    }
} catch (error) {
    // Keep connection strings and arguments out of the demo output.
    print("MongoDB demo operation failed (" + (error.codeName ?? error.name) + ").");
    quit(1);
}
