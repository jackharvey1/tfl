module.exports.max = function(Model, sortBy) {
    return new Promise((resolve) => {
        Model.findOne().sort(`-${sortBy}`)
            .exec((err, item) => {
                resolve({
                    [sortBy]: {
                        max: item[sortBy]
                    }
                });
            });
    });
};

module.exports.min = function(Model, sortBy) {
    return new Promise((resolve) => {
        Model.findOne().sort(`${sortBy}`)
            .exec((err, item) => {
                resolve({
                    [sortBy]: {
                        min: item[sortBy]
                    }
                });
            });
    });
};
