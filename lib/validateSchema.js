/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Gajus Kuizinas @gajus
*/
"use strict";
// The fastest JSON-Schema Validator. Supports draft-04/06 http://epoberezkin.github.io/ajv/
// Ajv for Another JSON Schema Validator
const Ajv = require("ajv");
const ajv = new Ajv({
	errorDataPath: "configuration",
	allErrors: true,
	verbose: true
});
// ajv-keywords.defineKeywords(ajv-instance, <keywords>)
require("ajv-keywords")(ajv, ["instanceof"]);
require("../schemas/ajv.absolutePath")(ajv);

/**
 * 验证 json-schema
 * @param schema 预置 json-schema
 * @param options 选项
 */
function validateSchema(schema, options) {
	// 配置为数组
	if(Array.isArray(options)) {
		// 递归遍历 json-object
		const errors = options.map((options) => validateObject(schema, options));
		// 对于每一个不符合 json-schema 的项目
		errors.forEach((list, idx) => {
			list.forEach(function applyPrefix(err) {
				err.dataPath = `[${idx}]${err.dataPath}`;
				if(err.children) {
					err.children.forEach(applyPrefix);
				}
			});
		});
		return errors.reduce((arr, items) => {
			return arr.concat(items);
		}, []);
	// 配置为对象
	} else {
		return validateObject(schema, options);
	}
}

/**
 * 调用 ajv 验证 json 有效性，成功返回空数组，失败返回含错误的数组
 * @param schema 模式
 * @param options 选项
 * @returns {Array}
 */
function validateObject(schema, options) {
	const validate = ajv.compile(schema);
	const valid = validate(options);
	return valid ? [] : filterErrors(validate.errors);
}

/**
 *
 * @param errors
 * @returns {Array}
 */
function filterErrors(errors) {
	let newErrors = [];
	errors.forEach((err) => {
		const dataPath = err.dataPath;
		let children = [];
		newErrors = newErrors.filter((oldError) => {
			if(oldError.dataPath.includes(dataPath)) {
				if(oldError.children) {
					children = children.concat(oldError.children.slice(0));
				}
				oldError.children = undefined;
				children.push(oldError);
				return false;
			}
			return true;
		});
		if(children.length) {
			err.children = children;
		}
		newErrors.push(err);
	});

	return newErrors;
}

module.exports = validateSchema;
