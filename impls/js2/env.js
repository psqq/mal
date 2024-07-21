export class Env {
    constructor() {
        /** @type {Env} */
        this.outer = null;
        this.data = {};
    }

    set(k, v) {
        this.data[k] = v;
    }

    /**
     * @param {string} k
     * @returns {Env}
     */
    find(k) {
        if (k in this.data) {
            return this;
        }
        if (this.outer) {
            return this.outer.find(k);
        }
        return null;
    }

    get(k) {
        const env = this.find(k);
        if (env == null) {
            throw new Error(`'${k}' not found`);
        }
        return env.data[k];
    }
}

export class EnvFactory {
    makeEnv(outer = null) {
        const env = new Env();
        env.outer = outer;
        return env;
    }
}
