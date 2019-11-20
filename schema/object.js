const { urnify, ManifestHelper } = require('forge-server-utils');

const typeDefs = `
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
    page: Page!
  }

  type Derivative {
    name: String
  }
`;

const resolvers = {
  Object: {
    derivatives: async (parent, args, context) => {
      try {
        const manifest = await context.modelDerivativeClient.getManifest(urnify(parent.urn));
        const helper = new ManifestHelper(manifest);
        return helper.manifest.derivatives.map(derivative => ({
          name: derivative.name
        }));
      } catch (err) {
        return null;
      }
    }
  }
};

module.exports = {
  typeDefs,
  resolvers
};
