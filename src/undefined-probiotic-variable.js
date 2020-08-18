/**
 *
 * @param {string} varName
 * @param {TextStatement} textStatement
 */
function buildMessage(varName, textStatement)
{
    let lines = [];
    lines.push(`Undefined §-variable ${varName}§`);
    let p = textStatement;
    if (p) lines.push(`In text statement at ${p.locationAsString}`)
    for(p = p.includedFrom; p; p=p.includedFrom) {
        lines.push(`Included from ${p.locationAsString}`)
    }
    return lines.join("\n");
}

export default class UndefinedProbioticVariable extends Error
{
    constructor(varName, textStatement)
    {
        super(buildMessage(varName, textStatement))
    }
}