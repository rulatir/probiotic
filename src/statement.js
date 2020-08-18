import Location from "./location.js";

export class Statement
{
    /** @type {?Location} */
    location;

    /** @type {?IncludeStatement} */
    includedFrom;

    /** @type {string} */
    type;


    /** @param {string} type
     * @param {?Location} location
     * @param {?IncludeStatement} includedFrom
     */
    constructor(type,location, includedFrom)
    {
        this.type=type;
        this.location = location;
        this.includedFrom = includedFrom;
    }

    get locationAsString() {
        return this.location ? this.location.asString : "<unknown location>"
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
     * @param {?Location} location
     * @param {?IncludeStatement} includedFrom
     */
    constructor(file,statement,location,includedFrom)
    {
        super("include",location,includedFrom);
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
     * @param {?Location} location
     * @param {?IncludeStatement} includedFrom
     */
    constructor(key, value, exported,location,includedFrom) {
        super("define",location,includedFrom);
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
     * @param {?Location} location
     * @param {?IncludeStatement} includedFrom
     */
    constructor(text,location,includedFrom) {
        super("text",location,includedFrom);
        this.text = text;
    }
}