/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

// 编译器
const Compiler = require("./Compiler");
// 多个配置实例时使用多编译器
const MultiCompiler = require("./MultiCompiler");

const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const WebpackOptionsDefaulter = require("./WebpackOptionsDefaulter");
const validateSchema = require("./validateSchema");
const WebpackOptionsValidationError = require("./WebpackOptionsValidationError");
const webpackOptionsSchema = require("../schemas/webpackOptionsSchema.json");

/**
 * Webpack 核心源码
 * @param options Webpack 配置
 * @param callback 执行完成以后的回调
 * @returns {*}
 */
function webpack(options, callback) {
    // 验证配置文件
    const webpackOptionsValidationErrors = validateSchema(webpackOptionsSchema, options);
    if (webpackOptionsValidationErrors.length) {
        throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
    }
    let compiler;
    if (Array.isArray(options)) {
        // 多编译器接受一个 Webpack 实例化数组
        compiler = new MultiCompiler(options.map(options => webpack(options)));
    } else if (typeof options === "object") {
        // 将用户配置与默认配置合并，W@4 将会返回配置项
        // TODO webpack 4: process returns options
        new WebpackOptionsDefaulter().process(options);

        compiler = new Compiler();
        // 获取到编译的根目录 context: path.resolve(__dirname, "app")
        compiler.context = options.context;
        compiler.options = options;
        // 获取 Nodejs 的环境配置
        new NodeEnvironmentPlugin().apply(compiler);
        // 插件系统如果存在的话，一定是一个数组，Webpack会在编译前将其挂载在 compiler 上
        if (options.plugins && Array.isArray(options.plugins)) {
            compiler.apply.apply(compiler, options.plugins);
        }
        // applyPlugins: 将所有插件挂载在 "environment/after-environment" 两个钩子上
        compiler.applyPlugins("environment");
        compiler.applyPlugins("after-environment");
        // 将其他配置项挂载到编译器
        compiler.options = new WebpackOptionsApply().process(options, compiler);
    } else {
        // 被schemaCheck 漏测的部分 
        throw new Error("Invalid argument: options");
    }
    // 如果包含回调函数，则执行这个函数
    if (callback) {
        if (typeof callback !== "function") throw new Error("Invalid argument: callback");
        // 如果配置中包含监听配置，或者某个配置项包含了监听配置，则将监听配置添加到 compiler.watch 上
        if (options.watch === true || (Array.isArray(options) && options.some(o => o.watch))) {
            const watchOptions = Array.isArray(options) ? options.map(o => o.watchOptions || {}) : (options.watchOptions || {});
            return compiler.watch(watchOptions, callback);
        }
        compiler.run(callback);
    }
    return compiler;
}
exports = module.exports = webpack;

/**
 * 将初始化用到的默认插件挂载到 Webpack
 */
webpack.WebpackOptionsDefaulter = WebpackOptionsDefaulter;
webpack.WebpackOptionsApply = WebpackOptionsApply;
webpack.Compiler = Compiler;
webpack.MultiCompiler = MultiCompiler;
webpack.NodeEnvironmentPlugin = NodeEnvironmentPlugin;
webpack.validate = validateSchema.bind(this, webpackOptionsSchema);
webpack.validateSchema = validateSchema;
webpack.WebpackOptionsValidationError = WebpackOptionsValidationError;

/**
 * 这个导出函数写的很精髓了，配合 exports=module.exports=webpack
 * 达成 module.exports = webpack.DefinePlugin = require('DefinePlugin') 的效果
 * @param {*} obj 
 * @param {*} mappings 
 */
function exportPlugins(obj, mappings) {
    Object.keys(mappings).forEach(name => {
        Object.defineProperty(obj, name, {
            configurable: false,
            enumerable: true,
            get: mappings[name]
        });
    });
}

/**
 * 将其他插件导出
 */
exportPlugins(exports, {
    "DefinePlugin": () => require("./DefinePlugin"),
    "NormalModuleReplacementPlugin": () => require("./NormalModuleReplacementPlugin"),
    "ContextReplacementPlugin": () => require("./ContextReplacementPlugin"),
    "ContextExclusionPlugin": () => require("./ContextExclusionPlugin"),
    "IgnorePlugin": () => require("./IgnorePlugin"),
    "WatchIgnorePlugin": () => require("./WatchIgnorePlugin"),
    "BannerPlugin": () => require("./BannerPlugin"),
    "PrefetchPlugin": () => require("./PrefetchPlugin"),
    "AutomaticPrefetchPlugin": () => require("./AutomaticPrefetchPlugin"),
    "ProvidePlugin": () => require("./ProvidePlugin"),
    "HotModuleReplacementPlugin": () => require("./HotModuleReplacementPlugin"),
    "SourceMapDevToolPlugin": () => require("./SourceMapDevToolPlugin"),
    "EvalSourceMapDevToolPlugin": () => require("./EvalSourceMapDevToolPlugin"),
    "EvalDevToolModulePlugin": () => require("./EvalDevToolModulePlugin"),
    "CachePlugin": () => require("./CachePlugin"),
    "ExtendedAPIPlugin": () => require("./ExtendedAPIPlugin"),
    "ExternalsPlugin": () => require("./ExternalsPlugin"),
    "JsonpTemplatePlugin": () => require("./JsonpTemplatePlugin"),
    "LibraryTemplatePlugin": () => require("./LibraryTemplatePlugin"),
    "LoaderTargetPlugin": () => require("./LoaderTargetPlugin"),
    "MemoryOutputFileSystem": () => require("./MemoryOutputFileSystem"),
    "ProgressPlugin": () => require("./ProgressPlugin"),
    "SetVarMainTemplatePlugin": () => require("./SetVarMainTemplatePlugin"),
    "UmdMainTemplatePlugin": () => require("./UmdMainTemplatePlugin"),
    "NoErrorsPlugin": () => require("./NoErrorsPlugin"),
    "NoEmitOnErrorsPlugin": () => require("./NoEmitOnErrorsPlugin"),
    "NewWatchingPlugin": () => require("./NewWatchingPlugin"),
    "EnvironmentPlugin": () => require("./EnvironmentPlugin"),
    "DllPlugin": () => require("./DllPlugin"),
    "DllReferencePlugin": () => require("./DllReferencePlugin"),
    "LoaderOptionsPlugin": () => require("./LoaderOptionsPlugin"),
    "NamedModulesPlugin": () => require("./NamedModulesPlugin"),
    "NamedChunksPlugin": () => require("./NamedChunksPlugin"),
    "HashedModuleIdsPlugin": () => require("./HashedModuleIdsPlugin"),
    "ModuleFilenameHelpers": () => require("./ModuleFilenameHelpers")
});

/**
 * 导出内置优化插件
 */
exportPlugins(exports.optimize = {}, {
    "AggressiveMergingPlugin": () => require("./optimize/AggressiveMergingPlugin"),
    "AggressiveSplittingPlugin": () => require("./optimize/AggressiveSplittingPlugin"),
    "CommonsChunkPlugin": () => require("./optimize/CommonsChunkPlugin"),
    "ChunkModuleIdRangePlugin": () => require("./optimize/ChunkModuleIdRangePlugin"),
    "DedupePlugin": () => require("./optimize/DedupePlugin"),
    "LimitChunkCountPlugin": () => require("./optimize/LimitChunkCountPlugin"),
    "MinChunkSizePlugin": () => require("./optimize/MinChunkSizePlugin"),
    "ModuleConcatenationPlugin": () => require("./optimize/ModuleConcatenationPlugin"),
    "OccurrenceOrderPlugin": () => require("./optimize/OccurrenceOrderPlugin"),
    "UglifyJsPlugin": () => require("./optimize/UglifyJsPlugin")
});