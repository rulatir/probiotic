export class Statement
{
    /** @type {string} */
    type;

    /** @param {string} type */
    constructor(type)
    {
        this.type=type;
    }
}

export class IncludeStatement extends Statement
{
    /** @type {string} */
    file;

    /** @type {string} */
    statement;

    /**
     * @param {string} file
     * @param {string} statement
     */
    constructor(file,statement)
    {
        super("include");
        this.file = file;
        this.statement = statement;
    }
}

export class DefineStatement extends Statement
{
    /** @type {string} */
    key;
    /** @type {string} */
    value;
    /** @type {boolean} */
    exported;

    /**
     *
     * @param {string} key
     * @param {string} value
     * @param {boolean} exported
     */
    constructor(key, value, exported) {
        super("define");
        this.key = key;
        this.value = value;
        this.exported = exported;
    }
}

export class TextStatement extends Statement
{
    /** @type {string[]} */
    text;

    /**
     * @param {string[]} text
     */
    constructor(text) {
        super("text");
        this.text = text;
    }
}