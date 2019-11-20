const forgeBucketToGraphQL = (bucket) => {
    return {
        id: bucket.bucketKey,
        created: new Date(bucket.createdDate).toISOString()
    };
};

module.exports = {
    forgeBucketToGraphQL
};
