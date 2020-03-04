module.exports = {
    "presets": [
        [
            "@babel/preset-env",
            {

                "corejs": 3,
                "useBuiltIns": "entry",
                "targets": {
                    "esmodules": true,
                    "ie": "11"
                }
            }
        ]
    ]
};