export default class Location
{
    /** @type {?string} */
    file;
    /** @type {?number} */
    line;

    /**
     *
     * @param {?string} file
     * @param {?number} line
     */
    constructor(file, line)
    {
        this.file = file;
        this.line = line;
    }

    /**
     * @param {?number} line
     * @return Location
     */
    withLine(line)
    {
        return new Location(this.file, line);
    }

    /** @return Location */
    clone()
    {
        return new Location(this.file, this.line);
    }

    get asString() {
        return `${this.file || "???"}:${this.line || "???"}`;
    }
}