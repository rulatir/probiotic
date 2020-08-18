import {
    coerceToArray, dirname, is_file, realpath,
    file_get_contents, file_put_contents, passthru,
    trim
} from "./polyfills.js";
import { IncludeStatement, DefineStatement, TextStatement } from "./statement.js";
import Location from "./location.js";
import UndefinedProbioticVariable from "./undefined-probiotic-variable.js";



/**
 *
 * @param {string} templateFilePath
 * @param {object} defs
 * @param {object} exports
 * @param {?IncludeStatement} includedBy
 */
async function processTemplate(templateFilePath, defs, exports,includedBy)
{
    const result = [];
    const statements = await parseTemplate(templateFilePath, includedBy);
    for(let statement of statements) {
        if (statement instanceof IncludeStatement) {
            let exported = {};
            result.push(await processInclude(statement, Object.assign({},defs), exported, templateFilePath));
            defs = Object.assign(defs, exported);
        }
        else if (statement instanceof DefineStatement) {
            const key = `$(${statement.key}§)`;
            const expansion = {};
            if (key in defs) expansion[key] = substitute(key, defs);
            defs[key] = substituteRHS(statement.value, expansion);
            if(statement.exported) {
                exports[key] = defs[key]
            }
        }
        else if (statement instanceof TextStatement) {
            result.push(processText(coerceToArray(statement.text), defs, statement));
        }
    }
    await storeResult(templateFilePath, result);
}

/**
 *
 * @param {string[]} text
 * @param {object} defs
 * @param {?TextStatement} textStatement
 * @return {string[]}
 */
function processText(text, defs,textStatement)
{
    return text.map(textLine => substitute(textLine, defs, textStatement));
}

/**
 * @param {string} text
 * @param {object} defs
 * @return {string}
 */
function substituteRHS(text, defs)
{
    return text.replace(
        /\$\([_A-Za-z][_0-9A-Za-z]*§\)/g,
        match => text===match ? (defs[match] ?? match) : substituteRHS(defs[match] ?? match, defs)
    );
}

/**
 * @param {string} text
 * @param {object} defs
 * @param {?TextStatement} textStatement
 * @return {string}
 */
function substitute(text, defs,textStatement
)
{
    return text.replace(
        /\$\(([_A-Za-z][_0-9A-Za-z]*§)\)/g,
        (match, key) => {
            if (!(match in defs)) {
                throw (
                    textStatement
                        ? new UndefinedProbioticVariable($key, textStatement)
                        : new Error(`Undefined §-variable ${key}`)
                );
            }
            return substitute(defs[match], defs)
        }
    )
}

/**
 *
 * @param {IncludeStatement} statement
 * @param {Object} defs
 * @param {Object} exports
 * @param {string|null|undefined} [includedFrom]
 * @return {Promise<string|null|undefined>}
 */
async function processInclude(statement, defs, exports, includedFrom)
{
    const substitutedFilePath = substitute(statement.file, defs);
    const templateFilePath = await resolveInclude(substitutedFilePath, includedFrom);
    if (null!==templateFilePath) {
        const includeDefs = Object.assign({}, defs);
        includeDefs['$(HERE§)'] = dirname(templateFilePath);
        includeDefs['$(REL§)'] =
            (
                defs['$(REL§)']
                + '/'
                + computeRelativePath(dirname(includedFrom), dirname(templateFilePath))
            ).replace(/^\.\//,'');
        await processTemplate(templateFilePath, includeDefs, exports, statement);
        return "include " + templatePathToMakefilePath(substitutedFilePath);
    }
    return substitute(statement.statement, defs);
}

/**
 *
 * @param {string} origin
 * @param {string} target
 * @return {string}
 */
function computeRelativePath(origin, target)
{
    let originSegments = origin.split('/');
    let targetSegments = target.split('/');
    let k=0;
    while(k < Math.min(originSegments.length, targetSegments.length) && targetSegments[k]===originSegments[k]) ++k;
    const result = [];
    for(let i=0; i<originSegments.length-k; ++i) result.push('..');
    result.push(targetSegments.slice(k));
    return result.join('/')
}

/**
 *
 * @param {string} templateFilePath
 * @param {string} includedFrom
 * @return {Promise<string|null>}
 */
async function resolveInclude(templateFilePath, includedFrom)
{
    let resolved = templateFilePath;
    if ("/"!==templateFilePath.charAt(0)) resolved = dirname(includedFrom)+"/"+templateFilePath;
    return (await is_file(resolved)) ? (await realpath(resolved)) : null
}

/**
 *
 * @param {string} templateFilePath
 * @param {string[]} result
 */
async function storeResult(templateFilePath, result)
{
    const makefilePath = templatePathToMakefilePath(templateFilePath);
    const coerced = coerceToArray(result).map(coerceToArray);
    const flattened = [];
    for(let fragment of coerced) flattened.push(...fragment);
    await file_put_contents(makefilePath, flattened.join("\n"));
}

/**
 *
 * @param {string} templateFilePath
 * @param {?IncludeStatement} includedBy
 * @return {Promise<Statement[]>}
 */
async function parseTemplate(templateFilePath,includedBy)
{
    const result = [];
    const lines = await loadTemplate(templateFilePath);
    const text = [];
    const originalLineCount=lines.length;
    const fileLocation = new Location(templateFilePath,1);
    let textLocation = null;
    while(lines.length) {
        let statementLocation = fileLocation.withLine(originalLineCount - lines.length + 1);
        textLocation = textLocation | statementLocation;
        let statement = parseInclude(lines, statementLocation, includedBy) || parseDefine(lines, statementLocation, includedBy);
        if (statement) {
            flushText(result, text, textLocation, includedBy);
            textLocation = null;
            result.push(statement);
            continue;
        }
        text.push(lines.shift());
    }
    flushText(result, text, textLocation, includedBy);
    textLocation = null;
    return result;
}

/**
 *
 * @param {Statement[]} result
 * @param {string[]} text
 * @param {?Location} location
 * @param {?IncludeStatement} includedFrom
 */
function flushText(result, text, location,includedFrom)
{
    result.push(new TextStatement(text.slice(),location,includedFrom));
    text.length=0;
}

/**
 *
 * @param {string} templateFilePath
 * @return {Promise<string[]>}
 */
async function loadTemplate(templateFilePath)
{
    return (await file_get_contents(templateFilePath)).split("\n");
}

/**
 *
 * @param {string} makefilePath
 * @return {string}
 */
function makefilePathToTemplatePath(makefilePath)
{
    return makefilePath.replace(/^((?:.*\/)?)Biomakefile((?:\..*)?)$/,'$1Makefile$2.pb');
}

/**
 *
 * @param {string} templateFilePath
 * @return {string}
 */
function templatePathToMakefilePath(templateFilePath)
{
    return templateFilePath.replace(/^((?:.*\/)?)Makefile((?:\..*)?)\.pb$/,'$1Biomakefile$2');
}

/**
 *
 * @param {string[]} lines
 * @param {?Location} location
 * @param {?IncludeStatement} includedFrom
 * @return {IncludeStatement|null}
 */
function parseInclude(lines,location,includedFrom)
{
    const matches = consumeMatch(/^include\s+(\S.*)$/, lines);
    if (null===matches) return null;
    return new IncludeStatement(trim(matches[1]), matches[0],location,includedFrom);
}

/**
 *
 * @param {string[]} lines
 * @param {?Location} location
 * @param {?IncludeStatement} includedFrom
 * @return {DefineStatement|null}
 */
function parseDefine(lines,location,includedFrom)
{
    const matches = consumeMatch(/^((?:(?:export|define)\s+)?)([_A-Za-z][_0-9A-Za-z]*)§\s*=\s*(.*)$/, lines);
    if (null===matches) return null;
    let value = matches[3];
    let shouldExport = /^export\s+$/.test(matches[1]);
    let isDefine = /^define\s+$/.test(matches[1]);
    if(isDefine) {
        [value, shouldExport] = completeDefine(value, lines);
    }
    else {
        value = completeMultiline(value, lines);
    }
    return new DefineStatement(matches[2], trim(value," \t\r\n"), shouldExport, location, includedFrom);
}

/**
 *
 * @param {string} value
 * @param {string[]} lines
 * @return {string}
 */
function completeMultiline(value, lines)
{
    while(lines.length && "\\"===value.substr(value.length-1)) {
        value = value.substr(0,value.length-1)+"\n"+lines.shift();
    }
    return value;
}

/**
 *
 * @param {string} value
 * @param {string[]} lines
 * @return {string[]}
 */
function completeDefine(value, lines)
{
    let acceptedLines = [value];
    let shouldExport = false;
    while(lines.length) {
        if(/^endef\s*$/.test(lines[0])) {
            if(/^export\s*$/.test(acceptedLines[acceptedLines.length-1])) {
                acceptedLines.pop();
                shouldExport = true;
            }
            lines.shift();
            return [acceptedLines.join("\n"), shouldExport];
        }
        else {
            acceptedLines.push(lines.shift());
        }
    }
    throw "Unterminated define/endef";
}

/**
 *
 * @param {RegExp} regex
 * @param {string[]} lines
 * @return {string[]|null}
 */
function consumeMatch(regex, lines)
{
    if (0===lines.length) return null
    let matches = lines[0].match(regex);
    if (null!==matches) lines.shift();
    return matches;
}

/**
 *
 * @param {string|null} rootMakefile
 * @param {string[]|null|undefined} biomakeArgs
 * @param {boolean} preprocessOnly
 * @return {Promise<number>}
 */
async function probiotic(rootMakefile, biomakeArgs, preprocessOnly)
{
    const resolvedRootTemplate = await resolveInclude(
        makefilePathToTemplatePath(rootMakefile),
        process.cwd()+"/.dummy"
    );
    await processTemplate(
        resolvedRootTemplate,
        {
            ['$(HERE§)']: dirname(resolvedRootTemplate),
            ['$(REL§)']: '.'
        },
        {}
    );
    return preprocessOnly ? 0 : await runBiomake(rootMakefile, biomakeArgs);
}

/**
 *
 * @param {string} makefilePath
 * @param {string[]|null|undefined} biomakeArgs
 * @return {Promise<number>}
 */
async function runBiomake(makefilePath, biomakeArgs)
{
    const command = ["biomake", "-H", ...(biomakeArgs || [])].join(" ");
    console.log(command);
    return await passthru(command);
}

/**
 *
 * @param {number} argc
 * @param {string[]} argv
 * @return {Promise<number>}
 */
export default async function main(argc, argv)
{
    let preprocessOnly = false;
    const defaults = {
        ['-Q']: 'poolq',
        ['-j']: '8',
        ['-f']: 'Biomakefile'
    };
    const convertedDefaults = {};
    for(let key in defaults) convertedDefaults[key] = convertArg(key,defaults[key]);
    const overrides = Object.assign({}, defaults);
    const convertedOverrides = Object.assign({},convertedDefaults);

    const biomakeArgs = [];
    argv.shift();
    while(argv.length) {
        let arg = argv.shift();
        if (arg === '--preprocess') {
            preprocessOnly = true;
            continue;
        }
        if (arg in defaults) {
            let overriddenValue = overrides[arg] = argv.shift();
            let convertedValue = convertedOverrides[arg] = convertArg(arg, overriddenValue);
            biomakeArgs.push(arg, convertedValue);
            delete convertedOverrides[arg];
        }
        else biomakeArgs.push(arg);
    }
    for(let k of Object.getOwnPropertyNames(convertedOverrides).reverse()) {
        biomakeArgs.unshift(k, convertedOverrides[k]);
    }
    return await probiotic(overrides['-f'], biomakeArgs, preprocessOnly);
}

/**
 *
 * @param {string} key
 * @param {string} value
 * @return {string}
 */
function convertArg(key, value)
{
    switch(key) {
        case '-f': return templatePathToMakefilePath(value);
        default: return value;
    }
}
