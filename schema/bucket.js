const { forgeBucketToGraphQL } = require('../helpers/bucket');
const { forgeObjectToGraphQL } = require('../helpers/object');

const typeDefs = `
  type BucketsPage {
    buckets: [Bucket!]
    page: Page!
  }

  "[Autodesk Forge](https://forge.autodesk.com) Simple Storage Bucket"
  type Bucket {
    id: ID!
    created: String!
    objects: [Object!]
    objectsPage(offset: Int = 0, limit: Int = 32): ObjectsPage!
  }
`;

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
                page: {
                    offset: offset,
                    limit: limit,
                    total: buckets.length
                }
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
                page: {
                    offset: offset,
                    limit: limit,
                    total: objects.length
                }
            };
        }
    }
};

module.exports = {
    typeDefs,
    resolvers
};
