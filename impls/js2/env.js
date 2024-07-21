import { MalList, MalTypesFactory, MalVector, isMalList } from './types.js';

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
    /**
     * @param {Env} outer
     * @param {MalList} binds
     * @param {MalType[]} exprs
     * @returns
     */
    makeEnv(outer = null, binds = null, exprs = []) {
        const env = new Env();
        env.outer = outer;
        if (isMalList(binds)) {
            for (const [i, b] of binds.value.entries()) {
                if (b.value === '&') {
                    const restExprs = new MalTypesFactory().makeList(exprs.slice(i));
                    env.set(binds.value[i + 1].value, restExprs);
                    break;
                } else {
                    env.set(b.value, exprs[i]);
                }
            }
        }
        return env;
    }
}
