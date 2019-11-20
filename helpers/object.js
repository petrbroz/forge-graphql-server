const forgeObjectToGraphQL = (obj) => {
    return {
        id: obj.objectKey,
        urn: obj.objectId,
        url: obj.location,
        sha1: obj.sha1,
        size: obj.size
    };
};

module.exports = {
    forgeObjectToGraphQL
};
