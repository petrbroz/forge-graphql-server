const typeDefs = `
  type Query {
    buckets: [Bucket]
    bucketsPage(offset: Int = 0, limit: Int = 32): BucketsPage!
  }

  type Page {
    offset: Int!
    limit: Int!
    total: Int!
  }
`;

const resolvers = {
};

module.exports = {
  typeDefs,
  resolvers
};
