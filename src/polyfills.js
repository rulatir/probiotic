import * as _fs from 'fs';
const fs = _fs.promises;
import path from 'path';
import passthruImpl from "passthru";

export function coerceToArray(v)
{
    return Array.isArray(v) ? v : [v];
}

export const dirname = path.dirname;
export const realpath = fs.realpath;

/**
 * @param {string} path
 * @return {Promise<boolean>}
 */
export async function is_file(path)
{
    try {
        return (await fs.stat(path)).isFile();
    }
    catch (e) {
        return false;
    }
}

/**
 *
 * @param {string} path
 * @return {Promise<string>}
 */
export async function file_get_contents(path)
{
    return (await fs.readFile(path,"utf-8")).toString();
}

/**
 * @param {string} path
 * @param {string} contents
 * @return {Promise<void>}
 */
export async function file_put_contents(path, contents)
{
    await fs.writeFile(path, contents, "utf-8");
}

/**
 *
 * @param {string} command
 * @return {Promise<number>}
 */
export function passthru(command)
{
    return new Promise((resolve, reject) => {
        passthruImpl(command, function(error) {
            if (error) console.error(error);
            resolve(error ? error.code : 0);
        })
    });
}

/**
 *
 * @param {string} str
 * @param {string|undefined} chars
 * @return string
 */
export function trim(str, chars)
{
    if('string' !== typeof chars) chars = " \t\r\n";
    const characterClass = '[' + quoteCharacterClassMembers(chars) + ']';
    const leftTrimmer = new RegExp(`^${characterClass}*`);
    const rightTrimmer = new RegExp(`${characterClass}*$`);
    return str.replace(leftTrimmer,'').replace(rightTrimmer,'');
}

function quoteCharacterClassMembers(chars)
{
    let result = "";
    for(let i=0; i<chars.length; ++i) {
        let c = chars.charAt(i);
        switch(c) {
            case '-':
            case ']':
            case '\\': result = result + '\\'+c; break;
            case '\r': result = result + '\\r'; break;
            case '\n': result = result + '\\n'; break;
            case '\t': result = result + '\\t'; break;
            default: result = result + c;
        }
    }
    return result;
}