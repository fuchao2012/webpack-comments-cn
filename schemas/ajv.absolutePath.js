"use strict";

/**
 * 捕获是否是绝对路径的错误
 * @param shouldBeAbsolute boolean 是否是绝对路径
 * @param data 数据
 * @param schema 格式
 * @returns {{keyword: string, params: {absolutePath: *}, message: string, parentSchema: *}}
 */
const getErrorFor = (shouldBeAbsolute, data, schema) => {
	const message = shouldBeAbsolute ?
		`The provided value ${JSON.stringify(data)} is not an absolute path!`
		: `A relative path is expected. However the provided value ${JSON.stringify(data)} is an absolute path!`;

	return {
		keyword: "absolutePath",
		params: { absolutePath: data },
		message: message,
		parentSchema: schema,
	};
};

/**
 * json-schema-validator
 * @param ajv
 */
module.exports = (ajv) => ajv.addKeyword("absolutePath", {
	errors: true,
	type: "string",
	compile(expected, schema) {
		function callback(data) {
			const passes = expected === /^(?:[A-Za-z]:\\|\/)/.test(data);
			if(!passes) {
				callback.errors = [getErrorFor(expected, data, schema)];
			}
			return passes;
		}
		callback.errors = [];
		return callback;
	}
});
