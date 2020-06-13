import * as _fs from 'fs';
const fs = _fs.promises;
import path from 'path';
import * as child_process from "child_process";

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
        child_process.exec(command, function(error, stdout, stderr) {
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            resolve(error ? error.code : 0);
        })
    });
}