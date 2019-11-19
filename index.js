const { ApolloServer, gql } = require('apollo-server');
const { DataManagementClient, ModelDerivativeClient, urnify, ManifestHelper } = require('forge-server-utils');

const typeDefs = gql`
  type Query {
    buckets: [Bucket]
    bucketsPage(offset: Int = 0, limit: Int = 32): BucketsPage
  }

  "[Autodesk Forge](https://forge.autodesk.com) Simple Storage Bucket"
  type Bucket {
    id: ID!
    created: String!
    objects: [Object!]
    objectsPage(offset: Int = 0, limit: Int = 32): ObjectsPage!
  }

  type BucketsPage {
    buckets: [Bucket!]
    offset: Int!
    limit: Int!
    total: Int!
  }

  "[Autodesk Forge](https://forge.autodesk.com) Simple Storage Object"
  type Object {
    id: ID!
    urn: String!
    url: String!
    sha1: String!
    size: Int!
    derivatives: [Derivative!]
  }

  type ObjectsPage {
    objects: [Object!]
    offset: Int!
    limit: Int!
    total: Int!
  }

  type Derivative {
    name: String
  }
`;

const forgeBucketToGraphQL = (bucket) => {
    return {
        id: bucket.bucketKey,
        created: new Date(bucket.createdDate).toISOString()
    };
};

const forgeObjectToGraphQL = (obj) => {
    return {
        id: obj.objectKey,
        urn: obj.objectId,
        url: obj.location,
        sha1: obj.sha1,
        size: obj.size
    };
};

const resolvers = {
    Query: {
        buckets: async (parent, args, context) => {
            const buckets = await context.dataManagementClient.listBuckets();
            return buckets.map(forgeBucketToGraphQL);
        },
        bucketsPage: async (parent, args, context) => {
            const { offset, limit } = args;
            const buckets = await context.dataManagementClient.listBuckets();
            return {
                buckets: buckets.filter((_, i) => i >= offset && i < offset + limit).map(forgeBucketToGraphQL),
                offset: offset,
                limit: limit,
                total: buckets.length
            };
        }
    },
    Bucket: {
        objects: async (parent, args, context) => {
            const objects = await context.dataManagementClient.listObjects(parent.id);
            return objects.map(forgeObjectToGraphQL);
        },
        objectsPage: async (parent, args, context) => {
            const { offset, limit } = args;
            const objects = await context.dataManagementClient.listObjects(parent.id);
            return {
                objects: objects.filter((_, i) => i >= offset && i < offset + limit).map(forgeObjectToGraphQL),
                offset: offset,
                limit: limit,
                total: objects.length
            };
        }
    },
    Object: {
        derivatives: async (parent, args, context) => {
            try {
                const manifest = await context.modelDerivativeClient.getManifest(urnify(parent.urn));
                const helper = new ManifestHelper(manifest);
                return helper.manifest.derivatives.map(derivative => ({
                    name: derivative.name
                }));
            } catch(err) {
                return null;
            }
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
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

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
