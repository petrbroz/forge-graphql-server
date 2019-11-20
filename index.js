const { GraphQLServer } = require('graphql-yoga');
const { DataManagementClient, ModelDerivativeClient } = require('forge-server-utils');

const { typeDefs: rootTypeDefs, resolvers: rootResolvers } = require('./schema/root');
const { typeDefs: bucketTypeDefs, resolvers: bucketResolvers } = require('./schema/bucket');
const { typeDefs: objectTypeDefs, resolvers: objectResolvers } = require('./schema/object');

function mergeResolvers(...resolvers) {
    let result = {};
    for (const resolver of resolvers) {
        for (const key of Object.keys(resolver)) {
            result[key] = Object.assign(result[key] || {}, resolver[key]);
        }
    }
    return result;
}

const server = new GraphQLServer({
    typeDefs: [rootTypeDefs, bucketTypeDefs, objectTypeDefs],
    resolvers: mergeResolvers(rootResolvers, bucketResolvers, objectResolvers),
    context: ({ req }) => {
        // For now, support authenticating Forge requests with specific credentials.
        // Later on, we'd only support passing along existing auth tokens.
        const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
        const auth = (FORGE_CLIENT_ID && FORGE_CLIENT_SECRET)
            ? { client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET }
            : { token: req.headers.authorization.replace('Bearer ', '') };
        return {
            dataManagementClient: new DataManagementClient(auth),
            modelDerivativeClient: new ModelDerivativeClient(auth)
        };
    }
});

const options = {
    port: process.env.PORT || 8000,
    endpoint: '/graphql',
    subscriptions: '/subscriptions',
    playground: '/playground',
};

server.start(options, ({ port }) =>
    console.log(`Server started, listening on port ${port} for incoming requests.`)
);
