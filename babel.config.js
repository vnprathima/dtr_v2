module.exports = {
    "presets": [
        [
            "@babel/preset-env",
            {
                "corejs": "3.6.4",
                "useBuiltIns": "entry",
                "targets": {
                    "esmodules": true,
                    "ie": "11"
                }
            }
        ]
    ]
};